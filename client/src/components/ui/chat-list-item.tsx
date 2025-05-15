import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { AvatarWithStatus } from "./avatar-with-status";
import { ChatWithLastMessage, User } from "@shared/schema";

interface ChatListItemProps {
  chat: ChatWithLastMessage;
  isActive: boolean;
  onClick: () => void;
  displayInfo: {
    name: string;
    avatar: string | null;
    isOnline: boolean;
  };
  currentUserId: string;
}

export function ChatListItem({ 
  chat, 
  isActive, 
  onClick, 
  displayInfo,
  currentUserId 
}: ChatListItemProps) {
  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Kecha";
    } else if (isThisWeek(date)) {
      // Get day name in Uzbek
      const dayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
      return dayNames[date.getDay()];
    } else {
      return format(date, "dd.MM.yy");
    }
  };

  const formatLastMessage = (message: any, senderId: string) => {
    if (!message) return "";
    
    const isSentByMe = senderId === currentUserId;
    
    if (chat.isGroup && !isSentByMe) {
      const sender = chat.participants.find(p => p.id === senderId);
      return <><span className="font-medium">{sender?.nickname || "Foydalanuvchi"}:</span> {message.content}</>;
    }
    
    return message.content;
  };

  // Check if message time is available
  const messageTime = chat.lastMessage 
    ? formatMessageTime(new Date(chat.lastMessage.createdAt)) 
    : formatMessageTime(new Date(chat.createdAt));

  return (
    <div 
      className={`p-3 flex items-center gap-3 cursor-pointer ${
        isActive 
          ? 'bg-light-300 dark:bg-dark-600' 
          : 'hover:bg-light-300 dark:hover:bg-dark-600'
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <AvatarWithStatus 
          src={displayInfo.avatar}
          name={displayInfo.name}
          isOnline={displayInfo.isOnline}
          size="lg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-dark-800 dark:text-light-100 truncate">
            {displayInfo.name}
            {chat.isGroup && <span className="text-dark-400 dark:text-light-500 ml-1">· {chat.participants.length} a'zo</span>}
          </h3>
          <span className={`text-xs ${chat.unreadCount > 0 ? 'text-primary font-medium' : 'text-dark-400 dark:text-light-500'}`}>
            {messageTime}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-dark-500 dark:text-light-500 text-sm truncate">
            {chat.lastMessage 
              ? formatLastMessage(chat.lastMessage, chat.lastMessage.senderId)
              : chat.isGroup 
                ? "Yangi guruh yaratildi" 
                : "Yangi chat yaratildi"}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-primary text-white text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
