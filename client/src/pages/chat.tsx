import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatListItem } from "@/components/ui/chat-list-item";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import { Phone, Video, MoreVertical, Search, Edit, X } from "lucide-react";
import { type Chat, type ChatWithLastMessage, type MessageWithSender } from "@shared/schema";
import { CallDialog } from "@/components/ui/call-dialog";

export default function Chat() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<ChatWithLastMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lastMessage, sendMessage } = useWebSocket();
  
  // Call state
  const [callState, setCallState] = useState<{
    isActive: boolean;
    callType: 'audio' | 'video' | null;
    isIncoming: boolean;
    isConnected: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    callerId?: string;
    callerName?: string;
    callerAvatar?: string;
  }>({
    isActive: false,
    callType: null,
    isIncoming: false,
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
  });

  // Query for user's chats
  const { data: chats = [] } = useQuery({
    queryKey: ["/api/chats"],
    refetchInterval: 30000,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid duplicates
  });
  
  // Query for user search
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/users/search", searchUserQuery],
    queryFn: async () => {
      if (!searchUserQuery || searchUserQuery.length < 2) return [];
      const url = `/api/users/search?q=${encodeURIComponent(searchUserQuery)}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error(`Search failed: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!searchUserQuery && searchUserQuery.length >= 2 && showUserSearch,
  });

  // Query for messages in selected chat
  const { data: messages = [] } = useQuery({
    queryKey: [selectedChat ? `/api/chats/${selectedChat.id}/messages` : null],
    enabled: !!selectedChat,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid duplicates
    refetchOnReconnect: false, // Don't refetch on reconnect to avoid duplicates
    refetchInterval: false, // Don't auto-refetch, rely on WebSocket
  });

  // State for typing
  const [typingUsers, setTypingUsers] = useState<{ [chatId: number]: string[] }>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebRTC refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  // Stream state for CallDialog
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Handle call actions
  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!selectedChat || !user) return;
    
    const otherParticipant = selectedChat.participants?.find(p => p.id !== user.id);
    if (!otherParticipant) return;
    
    setCallState({
      isActive: true,
      callType: type,
      isIncoming: false,
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      callerId: otherParticipant.id,
      callerName: otherParticipant.nickname || otherParticipant.username,
      callerAvatar: otherParticipant.profileImageUrl,
    });
    
    // Send call signal via WebSocket
    sendMessage('call', {
      type,
      chatId: selectedChat.id,
      targetUserId: otherParticipant.id,
      action: 'initiate',
    });
    
    // Initialize WebRTC for outgoing call
    try {
      await initializeWebRTCForCall(false);
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };
  
  const handleAcceptCall = async () => {
    setCallState(prev => ({ ...prev, isConnected: true, isIncoming: false }));
    
    if (callState.callerId) {
      sendMessage('call', {
        type: callState.callType,
        targetUserId: callState.callerId,
        action: 'accept',
      });
      
      // Initialize WebRTC for incoming call
      try {
        await initializeWebRTCForCall(true);
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
      }
    }
  };
  
  const initializeWebRTCForCall = async (isIncoming: boolean) => {
    try {
      console.log('Initializing WebRTC for call:', { isIncoming, callType: callState.callType });
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.callType === 'video'
      });
      
      console.log('Got user media:', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
        console.log('Added local track:', track.kind, track.id);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind, event.track.id);
        const remoteStream = event.streams[0] || event.streams;
        remoteStreamRef.current = remoteStream;
        setRemoteStream(remoteStream);
        
        console.log('Remote stream received:', {
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          streamId: remoteStream.id
        });
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && callState.callerId) {
          console.log('Sending ICE candidate');
          sendMessage('call', {
            type: callState.callType,
            targetUserId: callState.callerId,
            action: 'ice-candidate',
            candidate: event.candidate
          });
        } else if (!event.candidate) {
          console.log('ICE gathering complete');
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          console.log('WebRTC connected!');
        } else if (peerConnection.connectionState === 'failed') {
          console.error('WebRTC connection failed');
        }
      };
      
      if (isIncoming) {
        // For incoming call, wait for offer
        // This will be handled when offer is received via WebSocket
        console.log('Waiting for offer from caller...');
      } else {
        // For outgoing call, create offer
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callState.callType === 'video'
        });
        await peerConnection.setLocalDescription(offer);
        
        console.log('Created offer for outgoing call:', offer.type);
        
        if (callState.callerId) {
          sendMessage('call', {
            type: callState.callType,
            targetUserId: callState.callerId,
            action: 'offer',
            offer: offer
          });
        }
      }
      
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      alert('Mikrofon yoki kameraga kirish imkoni yo\'q. Iltimos, ruxsat bering.');
    }
  };
  
  const handleRejectCall = () => {
    if (callState.callerId) {
      sendMessage('call', {
        type: callState.callType,
        targetUserId: callState.callerId,
        action: 'reject',
      });
    }
    
    setCallState({
      isActive: false,
      callType: null,
      isIncoming: false,
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
    });
  };
  
  const handleEndCall = () => {
    // Cleanup WebRTC
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    
    // Clear stream state
    setLocalStream(null);
    setRemoteStream(null);
    
    if (callState.callerId) {
      sendMessage('call', {
        type: callState.callType,
        targetUserId: callState.callerId,
        action: 'end',
      });
    }
    
    setCallState({
      isActive: false,
      callType: null,
      isIncoming: false,
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
    });
  };
  
  const handleToggleMute = () => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    // Toggle audio track
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };
  
  const handleToggleVideo = () => {
    setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
    // Toggle video track
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };
  
  const handleWebRTCOffer = async (offer: RTCSessionDescriptionInit) => {
    console.log('Handling WebRTC offer:', offer.type);
    try {
      if (!peerConnectionRef.current) {
        console.log('No peer connection, initializing...');
        await initializeWebRTCForCall(true);
      }
      if (peerConnectionRef.current) {
        console.log('Setting remote description (offer)');
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Creating answer');
        const answer = await peerConnectionRef.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callState.callType === 'video'
        });
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log('Answer created:', answer.type);
        
        if (callState.callerId) {
          sendMessage('call', {
            type: callState.callType,
            targetUserId: callState.callerId,
            action: 'answer',
            answer: answer
          });
          console.log('Answer sent to caller');
        }
      }
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  };
  
  const handleWebRTCAnswer = async (answer: RTCSessionDescriptionInit) => {
    console.log('Handling WebRTC answer:', answer.type);
    try {
      if (peerConnectionRef.current) {
        console.log('Setting remote description (answer)');
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set successfully');
      } else {
        console.error('No peer connection available for answer');
      }
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  };
  
  const handleWebRTCIceCandidate = async (candidate: RTCIceCandidateInit) => {
    console.log('Handling ICE candidate');
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE candidate added successfully');
      } else {
        console.warn('No peer connection available for ICE candidate');
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  // Handle receiving messages from WebSocket
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'call') {
        const callData = lastMessage.payload;
        
        if (callData.action === 'initiate') {
          // Incoming call - play notification sound
          try {
            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission();
            }
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Qo\'ng\'iroq', {
                body: `${callData.type === 'video' ? 'Video' : 'Ovozli'} qo'ng'iroq`,
                icon: '/favicon.ico',
                tag: 'call',
                requireInteraction: true
              });
            }
          } catch (error) {
            console.error('Error showing notification:', error);
          }
          
          // Incoming call
          const caller = selectedChat?.participants?.find(p => p.id === callData.fromUserId);
          if (caller) {
            setCallState({
              isActive: true,
              callType: callData.type,
              isIncoming: true,
              isConnected: false,
              isMuted: false,
              isVideoOff: false,
              callerId: caller.id,
              callerName: caller.nickname || caller.username,
              callerAvatar: caller.profileImageUrl,
            });
          } else {
            // If caller not in selected chat, find in all chats
            const allChats = queryClient.getQueryData(['/api/chats']) as ChatWithLastMessage[] || [];
            for (const chat of allChats) {
              const caller = chat.participants?.find(p => p.id === callData.fromUserId);
              if (caller) {
                setCallState({
                  isActive: true,
                  callType: callData.type,
                  isIncoming: true,
                  isConnected: false,
                  isMuted: false,
                  isVideoOff: false,
                  callerId: caller.id,
                  callerName: caller.nickname || caller.username,
                  callerAvatar: caller.profileImageUrl,
                });
                break;
              }
            }
          }
        } else if (callData.action === 'accept') {
          setCallState(prev => ({ ...prev, isConnected: true }));
          // Initialize WebRTC when call is accepted
          initializeWebRTCForCall(false).catch(err => console.error('WebRTC init error:', err));
        } else if (callData.action === 'offer') {
          // Handle incoming offer
          handleWebRTCOffer(callData.offer).catch(err => console.error('Offer handling error:', err));
        } else if (callData.action === 'answer') {
          // Handle incoming answer
          handleWebRTCAnswer(callData.answer).catch(err => console.error('Answer handling error:', err));
        } else if (callData.action === 'ice-candidate') {
          // Handle ICE candidate
          handleWebRTCIceCandidate(callData.candidate).catch(err => console.error('ICE candidate error:', err));
        } else if (callData.action === 'reject' || callData.action === 'end') {
          // Cleanup WebRTC
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          remoteStreamRef.current = null;
          setLocalStream(null);
          setRemoteStream(null);
          setCallState({
            isActive: false,
            callType: null,
            isIncoming: false,
            isConnected: false,
            isMuted: false,
            isVideoOff: false,
          });
        }
      } else if (lastMessage.type === 'message') {
        const newMessage = lastMessage.payload;
        
        console.log('Received message via WebSocket:', {
          messageId: newMessage.id,
          chatId: newMessage.chatId,
          senderId: newMessage.senderId,
          content: newMessage.content,
          currentUserId: user?.id,
          selectedChatId: selectedChat?.id
        });
        
        // Only process if message is not from current user (to avoid duplicates)
        if (newMessage.senderId !== user?.id && newMessage.chatId) {
          // Add message to the chat if it's the selected chat
          if (selectedChat && newMessage.chatId === selectedChat.id) {
            queryClient.setQueryData(
              [`/api/chats/${selectedChat.id}/messages`],
              (oldData: MessageWithSender[] = []) => {
                // Check if message already exists to prevent duplicates
                const exists = oldData.some(msg => 
                  msg.id === newMessage.id || 
                  (msg.content === newMessage.content && 
                   msg.senderId === newMessage.senderId &&
                   Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 2000)
                );
                if (exists) {
                  console.log('Duplicate message detected, skipping:', newMessage.id);
                  return oldData;
                }
                console.log('Adding new message from WebSocket to selected chat:', newMessage.id);
                return [...oldData, newMessage];
              }
            );
            
            // Mark as read if chat is open
            apiRequest({
              method: 'POST',
              url: `/api/messages/${newMessage.id}/read`
            }).catch(err => console.error('Error marking message as read:', err));
          } else {
            // Message is for a different chat - just update chat list
            console.log('Message received for different chat, updating chat list');
          }
          
          // Always invalidate chat list to update unread counts and last message
          queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
        } else {
          console.log('Skipping message - from current user or missing chatId');
        }
      } else if (lastMessage.type === 'typing') {
        const { chatId, userId, isTyping } = lastMessage.payload;
        
        setTypingUsers(prev => {
          const chatTypers = [...(prev[chatId] || [])];
          
          if (isTyping) {
            if (!chatTypers.includes(userId)) {
              chatTypers.push(userId);
            }
          } else {
            const index = chatTypers.indexOf(userId);
            if (index !== -1) {
              chatTypers.splice(index, 1);
            }
          }
          
          return {
            ...prev,
            [chatId]: chatTypers
          };
        });
      } else if (lastMessage.type === 'user_online' || lastMessage.type === 'user_offline') {
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      } else if (lastMessage.type === 'call') {
        const { type, action, fromUserId, offer, answer, candidate } = lastMessage.payload;
        
        console.log('Received call message:', { type, action, fromUserId });
        
        if (action === 'initiate') {
          // Incoming call
          const caller = chats.find(c => 
            c.participants?.some(p => p.id === fromUserId)
          )?.participants?.find(p => p.id === fromUserId);
          
          if (caller) {
            setCallState({
              isActive: true,
              callType: type,
              isIncoming: true,
              isConnected: false,
              isMuted: false,
              isVideoOff: false,
              callerId: fromUserId,
              callerName: caller.nickname || caller.username,
              callerAvatar: caller.avatar || undefined,
            });
          }
        } else if (action === 'offer' && offer) {
          console.log('Received WebRTC offer');
          handleWebRTCOffer(offer).catch(err => {
            console.error('Error handling WebRTC offer:', err);
          });
        } else if (action === 'answer' && answer) {
          console.log('Received WebRTC answer');
          handleWebRTCAnswer(answer).then(() => {
            setCallState(prev => ({ ...prev, isConnected: true }));
          }).catch(err => {
            console.error('Error handling WebRTC answer:', err);
          });
        } else if (action === 'ice-candidate' && candidate) {
          console.log('Received ICE candidate');
          handleWebRTCIceCandidate(candidate).catch(err => {
            console.error('Error handling ICE candidate:', err);
          });
        } else if (action === 'accept') {
          console.log('Call accepted');
          setCallState(prev => ({ ...prev, isConnected: true }));
        } else if (action === 'reject' || action === 'end') {
          console.log('Call rejected/ended');
          handleEndCall();
        }
      }
    }
  }, [lastMessage, queryClient, selectedChat, chats, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing status
  const handleTyping = (isTyping: boolean) => {
    if (selectedChat) {
      setIsTyping(isTyping);
      
      sendMessage('typing', {
        chatId: selectedChat.id,
        isTyping
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          sendMessage('typing', {
            chatId: selectedChat.id,
            isTyping: false
          });
        }, 3000);
      }
    }
  };

  // Handle sending message
  const sendChatMessage = async (content: string) => {
    if (!selectedChat || !content.trim()) {
      console.log('Cannot send message: no chat selected or empty content');
      return false;
    }
    
    try {
      handleTyping(false);
      
      console.log('Sending message:', {
        chatId: selectedChat.id,
        content: content.trim(),
        userId: user?.id
      });
      
      // Send message via API
      const newMessage = await apiRequest({
        method: 'POST',
        url: `/api/chats/${selectedChat.id}/messages`,
        body: { content: content.trim() }
      });
      
      console.log('Message sent via API successfully:', {
        messageId: newMessage.id,
        chatId: newMessage.chatId,
        content: newMessage.content
      });
      
      // Add message to local state (only once, from API response)
      queryClient.setQueryData(
        [`/api/chats/${selectedChat.id}/messages`],
        (oldData: MessageWithSender[] = []) => {
          // Check if message already exists to prevent duplicates
          const exists = oldData.some(msg => 
            msg.id === newMessage.id || 
            (msg.content === newMessage.content && 
             msg.senderId === newMessage.senderId &&
             Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 2000)
          );
          if (exists) {
            console.log('Duplicate message detected when sending, skipping:', newMessage.id);
            return oldData;
          }
          console.log('Adding new message from API to local state:', newMessage.id);
          return [...oldData, newMessage];
        }
      );
      
      // Update chat list to show new last message
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        chatId: selectedChat.id,
        content: content.trim()
      });
      return false;
    }
  };
  
  // Create a new chat with a user
  const createNewChatWithUser = async (foundUser: any) => {
    try {
      const newChat = await apiRequest({
        method: 'POST',
        url: '/api/chats',
        body: JSON.stringify({
          name: `Chat with ${foundUser.nickname || foundUser.username}`,
          isGroup: false,
          participants: [foundUser.id]
        })
      });
      
      setSearchUserQuery('');
      setShowUserSearch(false);
      queryClient.invalidateQueries({queryKey: ['/api/chats']});
      
      setSelectedChat(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Get chat name and avatar
  const getChatDisplayInfo = (chat: ChatWithLastMessage) => {
    if (chat.isGroup) {
      return {
        name: chat.name || "Guruh",
        avatar: null,
        isOnline: false
      };
    }
    
    const otherParticipant = chat.participants?.find(p => p.id !== user?.id);
    
    return {
      name: otherParticipant?.nickname || otherParticipant?.username || "Foydalanuvchi",
      avatar: otherParticipant?.profileImageUrl,
      isOnline: otherParticipant?.isOnline || false
    };
  };

  // Function to mark messages as read
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      messages.forEach(message => {
        if (message.senderId !== user?.id && !message.isRead) {
          apiRequest({
            method: 'POST',
            url: `/api/messages/${message.id}/read`
          });
        }
      });
    }
  }, [selectedChat, messages, user?.id]);

  // Filter chats by search query
  const filteredChats = chats.filter((chat: ChatWithLastMessage) => {
    if (!searchQuery) return true;
    
    const chatInfo = getChatDisplayInfo(chat);
    return chatInfo.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Group messages by date
  const groupedMessages: { [date: string]: MessageWithSender[] } = {};
  
  messages.forEach(message => {
    const messageDate = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groupedMessages[messageDate]) {
      groupedMessages[messageDate] = [];
    }
    groupedMessages[messageDate].push(message);
  });

  return (
    <div className="h-screen flex bg-[#0e1621] text-white overflow-hidden">
      {/* Chat List Sidebar - Telegram style */}
      <div className="w-80 bg-[#17212b] border-r border-[#242f3d] flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="h-16 bg-[#17212b] border-b border-[#242f3d] flex items-center justify-between px-4 flex-shrink-0">
          <h1 className="text-xl font-semibold text-white">TarmoQ</h1>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a]"
            onClick={() => setShowUserSearch(!showUserSearch)}
          >
            <Edit className="h-5 w-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 border-b border-[#242f3d] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6e7a8a]" />
            <Input
              type="text"
              placeholder="Qidirish"
              className="w-full bg-[#242f3d] border-0 rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-[#6e7a8a] focus:ring-1 focus:ring-[#5288c1]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* User search interface */}
          {showUserSearch && (
            <div className="mt-3 bg-[#242f3d] rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Foydalanuvchini topish</h3>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-6 w-6 p-0 text-[#6e7a8a] hover:text-white"
                  onClick={() => {
                    setShowUserSearch(false);
                    setSearchUserQuery('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Ism bo'yicha qidirish"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full bg-[#17212b] border-0 text-white placeholder:text-[#6e7a8a]"
              />
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {isSearching ? (
                  <div className="text-center py-2 text-[#6e7a8a]">Qidirilmoqda...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((foundUser: any) => (
                    <div 
                      key={foundUser.id}
                      className="flex items-center gap-3 p-2 hover:bg-[#17212b] rounded-md cursor-pointer transition-colors"
                      onClick={() => createNewChatWithUser(foundUser)}
                    >
                      <div className="h-10 w-10 bg-[#5288c1] text-white flex items-center justify-center rounded-full font-medium">
                        {foundUser.nickname?.[0] || foundUser.username?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{foundUser.nickname || foundUser.username}</div>
                        <div className="text-xs text-[#6e7a8a]">@{foundUser.username}</div>
                      </div>
                    </div>
                  ))
                ) : searchUserQuery.length >= 2 ? (
                  <div className="text-center py-2 text-[#6e7a8a]">Foydalanuvchi topilmadi</div>
                ) : (
                  <div className="text-center py-2 text-[#6e7a8a]">Kamida 2 ta harf kiriting</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-[#6e7a8a]">
              {searchQuery ? "So'rovga mos chat topilmadi" : "Hali chatlar yo'q"}
            </div>
          ) : (
            filteredChats.map((chat: ChatWithLastMessage) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={selectedChat?.id === chat.id}
                onClick={() => setSelectedChat(chat)}
                displayInfo={getChatDisplayInfo(chat)}
                currentUserId={user?.id || ""}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Active Chat Area */}
      {selectedChat ? (
        <div className="flex flex-col flex-1 bg-[#0e1621] min-w-0">
          {/* Chat Header */}
          <div className="h-16 bg-[#17212b] border-b border-[#242f3d] flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <AvatarWithStatus
                src={getChatDisplayInfo(selectedChat).avatar}
                name={getChatDisplayInfo(selectedChat).name}
                isOnline={getChatDisplayInfo(selectedChat).isOnline}
              />
              <div className="min-w-0">
                <h3 className="font-medium text-white truncate">
                  {getChatDisplayInfo(selectedChat).name}
                </h3>
                {getChatDisplayInfo(selectedChat).isOnline ? (
                  <p className="text-xs text-[#6e7a8a]">Online</p>
                ) : (
                  <p className="text-xs text-[#6e7a8a]">Offline</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a] hover:text-white transition-colors"
                aria-label="Qo'ng'iroq"
                onClick={() => handleStartCall('audio')}
                disabled={callState.isActive}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className={`h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a] hover:text-white transition-colors ${
                  callState.isActive && callState.callType === 'video' 
                    ? 'bg-[#5288c1] text-white ring-2 ring-[#5288c1]/50' 
                    : ''
                }`}
                aria-label="Video qo'ng'iroq"
                onClick={() => handleStartCall('video')}
                disabled={callState.isActive}
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a] hover:text-white transition-colors"
                aria-label="Ko'proq"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-[#0e1621]">
            {Object.keys(groupedMessages).map(date => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex justify-center mb-4">
                  <span className="bg-[#242f3d] text-[#6e7a8a] text-xs px-3 py-1 rounded-full">
                    {new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                {/* Messages for this date */}
                {groupedMessages[date].map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOutgoing={message.senderId === user?.id}
                    showAvatar={
                      index === 0 || 
                      groupedMessages[date][index - 1]?.senderId !== message.senderId
                    }
                  />
                ))}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {typingUsers[selectedChat.id]?.length > 0 && (
              <div className="flex mb-4">
                <div className="flex-shrink-0 mr-3">
                  <AvatarWithStatus
                    src={null}
                    name="..."
                    size="sm"
                  />
                </div>
                <div className="max-w-[70%]">
                  <div className="bg-[#242f3d] py-3 px-5 rounded-2xl rounded-tl-sm inline-flex">
                    <span className="text-[#6e7a8a] typing-indicator">Yozmoqda</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <ChatInput onSend={sendChatMessage} onTyping={handleTyping} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-[#0e1621] p-6">
          <div className="text-center">
            <div className="h-24 w-24 bg-[#242f3d] rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="h-12 w-12 text-[#5288c1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Suhbatni boshlang</h2>
            <p className="text-[#6e7a8a] mb-6">Chat tanlang yoki yangi suhbat boshlang</p>
            <Button 
              className="bg-[#5288c1] hover:bg-[#4a7ab8] text-white py-2.5 px-6 rounded-full inline-flex items-center gap-2 transition-colors"
              onClick={() => setShowUserSearch(true)}
            >
              <Edit className="h-5 w-5" />
              <span>Yangi xabar</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Call Dialog */}
      {callState.isActive && (
        <CallDialog
          open={callState.isActive}
          onClose={handleRejectCall}
          callType={callState.callType || 'audio'}
          callerName={callState.callerName || 'Foydalanuvchi'}
          callerAvatar={callState.callerAvatar}
          isIncoming={callState.isIncoming}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
          isConnected={callState.isConnected}
          isMuted={callState.isMuted}
          isVideoOff={callState.isVideoOff}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          localStream={localStream}
          remoteStream={remoteStream}
        />
      )}
    </div>
  );
}
