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

  const messageTime = chat.lastMessage 
    ? formatMessageTime(new Date(chat.lastMessage.createdAt)) 
    : formatMessageTime(new Date(chat.createdAt));

  return (
    <div 
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
        isActive 
          ? 'bg-[#242f3d]' 
          : 'hover:bg-[#1e2832]'
      }`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <AvatarWithStatus 
          src={displayInfo.avatar}
          name={displayInfo.name}
          isOnline={displayInfo.isOnline}
          size="lg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-medium text-white truncate text-sm">
            {displayInfo.name}
            {chat.isGroup && <span className="text-[#6e7a8a] ml-1 font-normal">· {chat.participants.length} a'zo</span>}
          </h3>
          <span className={`text-xs flex-shrink-0 ml-2 ${
            chat.unreadCount > 0 ? 'text-[#5288c1] font-medium' : 'text-[#6e7a8a]'
          }`}>
            {messageTime}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-[#6e7a8a] text-sm truncate">
            {chat.lastMessage 
              ? formatLastMessage(chat.lastMessage, chat.lastMessage.senderId)
              : chat.isGroup 
                ? "Yangi guruh yaratildi" 
                : "Yangi chat yaratildi"}
          </p>
          {chat.unreadCount > 0 && (
            <span className="bg-[#5288c1] text-white text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center flex-shrink-0 font-medium">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
