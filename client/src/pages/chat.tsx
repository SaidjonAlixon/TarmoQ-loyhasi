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

export default function Chat() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<ChatWithLastMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lastMessage, sendMessage } = useWebSocket();

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
  });

  // State for typing
  const [typingUsers, setTypingUsers] = useState<{ [chatId: number]: string[] }>({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle receiving messages from WebSocket
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'message') {
        const newMessage = lastMessage.payload;
        
        // Only add message if it's not from current user (to avoid duplicates)
        // Messages from current user are already added via API response
        if (selectedChat && newMessage.chatId === selectedChat.id && newMessage.senderId !== user?.id) {
          queryClient.setQueryData(
            [`/api/chats/${selectedChat.id}/messages`],
            (oldData: MessageWithSender[] = []) => {
              // Check if message already exists to prevent duplicates (by ID and content+timestamp)
              const exists = oldData.some(msg => 
                msg.id === newMessage.id || 
                (msg.content === newMessage.content && 
                 Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 1000)
              );
              if (exists) {
                console.log('Duplicate message detected, skipping:', newMessage.id);
                return oldData;
              }
              console.log('Adding new message from WebSocket:', newMessage.id);
              return [...oldData, newMessage];
            }
          );
          
          // Mark as read
          apiRequest({
            method: 'POST',
            url: `/api/messages/${newMessage.id}/read`
          }).catch(err => console.error('Error marking message as read:', err));
        }
        
        // Only invalidate chat list, not messages (to avoid refetch duplicates)
        queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
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
      }
    }
  }, [lastMessage, queryClient, selectedChat]);

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
    if (!selectedChat || !content.trim()) return;
    
    try {
      handleTyping(false);
      
      // Send message via API only (WebSocket will handle broadcasting to other users)
      const newMessage = await apiRequest({
        method: 'POST',
        url: `/api/chats/${selectedChat.id}/messages`,
        body: JSON.stringify({ content })
      });
      
      console.log('Message sent via API:', newMessage.id);
      
      // Add message to local state (only once, from API response)
      queryClient.setQueryData(
        [`/api/chats/${selectedChat.id}/messages`],
        (oldData: MessageWithSender[] = []) => {
          // Check if message already exists to prevent duplicates (by ID and content+timestamp)
          const exists = oldData.some(msg => 
            msg.id === newMessage.id || 
            (msg.content === newMessage.content && 
             Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 1000)
          );
          if (exists) {
            console.log('Duplicate message detected when sending, skipping:', newMessage.id);
            return oldData;
          }
          console.log('Adding new message from API:', newMessage.id);
          return [...oldData, newMessage];
        }
      );
      
      // Only invalidate chat list, not messages (to avoid refetch duplicates)
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Don't send via WebSocket - API already handles it
      // WebSocket is only for receiving messages from other users
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
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
                placeholder="Taxallus yoki ism bo'yicha qidirish"
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
                className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a]"
                aria-label="Qo'ng'iroq"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a]"
                aria-label="Video qo'ng'iroq"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a]"
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
    </div>
  );
}
