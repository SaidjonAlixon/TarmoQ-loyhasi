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
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import { Phone, Video, Info, Edit, Search } from "lucide-react";
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
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Query for user search
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/users/search", searchUserQuery],
    enabled: !!searchUserQuery && searchUserQuery.length >= 2 && showUserSearch,
  });

  // Query for messages in selected chat
  const { data: messages = [] } = useQuery({
    queryKey: [selectedChat ? `/api/chats/${selectedChat.id}/messages` : null],
    enabled: !!selectedChat,
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
        
        // Update messages in current chat
        if (selectedChat && newMessage.chatId === selectedChat.id) {
          queryClient.setQueryData(
            [`/api/chats/${selectedChat.id}/messages`],
            (oldData: MessageWithSender[] = []) => [...oldData, newMessage]
          );
          
          // Mark as read
          apiRequest('POST', `/api/messages/${newMessage.id}/read`, {});
        }
        
        // Update chat list with new message
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
        // Refresh chats to show updated online status
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
      
      // Send typing status
      sendMessage('typing', {
        chatId: selectedChat.id,
        isTyping
      });
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // If typing, set a timeout to automatically clear typing status after 3 seconds
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
      // Clear typing status
      handleTyping(false);
      
      // Send message via API
      const response = await apiRequest('POST', `/api/chats/${selectedChat.id}/messages`, { content });
      const newMessage = await response.json();
      
      // Add message to local state
      queryClient.setQueryData(
        [`/api/chats/${selectedChat.id}/messages`],
        (oldData: MessageWithSender[] = []) => [...oldData, newMessage]
      );
      
      // Update chat list
      queryClient.invalidateQueries({ queryKey: ['/api/chats'] });
      
      // Send via WebSocket as well for immediate delivery
      sendMessage('message', {
        chatId: selectedChat.id,
        content
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
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
    
    // For direct chat, show the other participant
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
      // Mark all messages as read
      messages.forEach(message => {
        if (message.senderId !== user?.id && !message.isRead) {
          apiRequest('POST', `/api/messages/${message.id}/read`, {});
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
    <div className="h-screen flex flex-col md:flex-row">
      {/* Chat List */}
      <div className="w-full md:w-80 bg-white dark:bg-dark-700 border-r border-light-500 dark:border-dark-600 flex flex-col">
        {/* Search & Header */}
        <div className="p-4 border-b border-light-500 dark:border-dark-600">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold font-montserrat">TarmoQ</h1>
            <div className="flex gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                aria-label="Yangi chat"
                onClick={() => setShowUserSearch(!showUserSearch)}
              >
                <Edit className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Qidirish"
              className="w-full bg-light-300 dark:bg-dark-600 rounded-full py-2 pl-10 pr-4 text-dark-700 dark:text-light-300 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-dark-400 dark:text-light-500" />
          </div>
          
          {/* User search interface */}
          {showUserSearch && (
            <div className="mt-3 space-y-3 bg-light-200 dark:bg-dark-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-dark-700 dark:text-light-200">Foydalanuvchini topish</h3>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setShowUserSearch(false);
                    setSearchUserQuery('');
                  }}
                >
                  Bekor qilish
                </Button>
              </div>
              <Input
                placeholder="Taxallus yoki ism bo'yicha qidirish"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full"
              />
              
              {/* Search results */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {isSearching ? (
                  <div className="text-center py-2 text-dark-500 dark:text-light-400">Qidirilmoqda...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((foundUser: any) => (
                    <div 
                      key={foundUser.id}
                      className="flex items-center gap-3 p-2 hover:bg-light-300 dark:hover:bg-dark-700 rounded-md cursor-pointer"
                      onClick={async () => {
                        // Create a new chat with this user
                        try {
                          const newChat = await apiRequest('/api/chats', {
                            method: 'POST',
                            body: JSON.stringify({
                              name: `Chat with ${foundUser.nickname || foundUser.username}`,
                              isGroup: false,
                              participants: [foundUser.id]
                            })
                          });
                          
                          // Reset search and refresh chats
                          setSearchUserQuery('');
                          setShowUserSearch(false);
                          queryClient.invalidateQueries({queryKey: ['/api/chats']});
                          
                          // Select the new chat
                          setSelectedChat(newChat);
                        } catch (error) {
                          console.error('Error creating chat:', error);
                        }
                      }}
                    >
                      <div className="h-10 w-10 bg-primary text-white flex items-center justify-center rounded-full">
                        {foundUser.nickname?.[0] || foundUser.username?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-dark-700 dark:text-light-200">{foundUser.nickname || foundUser.username}</div>
                        <div className="text-xs text-dark-500 dark:text-light-400">@{foundUser.username}</div>
                      </div>
                    </div>
                  ))
                ) : searchUserQuery.length >= 2 ? (
                  <div className="text-center py-2 text-dark-500 dark:text-light-400">Foydalanuvchi topilmadi</div>
                ) : (
                  <div className="text-center py-2 text-dark-500 dark:text-light-400">Kamida 2 ta harf kiriting</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-dark-500 dark:text-light-400">
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
        <div className="hidden md:flex flex-col flex-1 bg-light-200 dark:bg-dark-800">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-light-500 dark:border-dark-600 bg-white dark:bg-dark-700">
            <div className="flex items-center gap-3">
              <AvatarWithStatus
                src={getChatDisplayInfo(selectedChat).avatar}
                name={getChatDisplayInfo(selectedChat).name}
                isOnline={getChatDisplayInfo(selectedChat).isOnline}
              />
              <div>
                <h3 className="font-medium text-dark-800 dark:text-light-100">
                  {getChatDisplayInfo(selectedChat).name}
                </h3>
                {getChatDisplayInfo(selectedChat).isOnline ? (
                  <p className="text-xs text-accent">Online</p>
                ) : (
                  <p className="text-xs text-dark-400 dark:text-light-500">Offline</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" aria-label="Qo'ng'iroq">
                <Phone className="h-5 w-5 text-gray-700" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Video qo'ng'iroq">
                <Video className="h-5 w-5 text-gray-700" />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Ma'lumot">
                <Info className="h-5 w-5 text-gray-700" />
              </Button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {Object.keys(groupedMessages).map(date => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex justify-center mb-4">
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
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
                  <div className="message-in bg-white dark:bg-dark-700 shadow-sm dark:shadow-message py-3 px-5 rounded-lg inline-flex">
                    <span className="text-dark-800 dark:text-light-200 typing-indicator">Yozmoqda</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* To scroll to the latest message */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <ChatInput onSend={sendChatMessage} onTyping={handleTyping} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-light-200 dark:bg-dark-800 p-6">
          <div className="text-center">
            <svg className="h-24 w-24 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-xl font-bold text-dark-700 dark:text-light-200 mb-2">Suhbatni boshlang</h2>
            <p className="text-dark-500 dark:text-light-400 mb-6">Chat tanlang yoki yangi suhbat boshlang</p>
            <Button className="bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-full inline-flex items-center gap-2 transition">
              <Edit className="h-5 w-5" />
              <span>Yangi xabar</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
