import { format } from "date-fns";
import { AvatarWithStatus } from "./avatar-with-status";
import { MessageWithSender } from "@shared/schema";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOutgoing: boolean;
  showAvatar: boolean;
}

export function MessageBubble({ message, isOutgoing, showAvatar }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.createdAt), "HH:mm");
  
  return (
    <div className={`flex mb-2 message-appear ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      {!isOutgoing && showAvatar ? (
        <div className="flex-shrink-0 mr-2">
          <AvatarWithStatus
            src={message.sender.profileImageUrl || null}
            name={message.sender.nickname || message.sender.username}
            size="sm"
          />
        </div>
      ) : !isOutgoing ? (
        <div className="w-10 mr-2"></div>
      ) : null}
      
      <div className={`max-w-[65%] ${isOutgoing ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
        {!isOutgoing && showAvatar && (
          <span className="text-xs text-[#6e7a8a] mb-1 px-1">
            {message.sender.nickname || message.sender.username}
          </span>
        )}
        <div className={`${
          isOutgoing 
            ? 'bg-[#5288c1] text-white rounded-2xl rounded-tr-sm' 
            : 'bg-[#242f3d] text-white rounded-2xl rounded-tl-sm'
        } px-4 py-2 shadow-sm`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex mt-1 items-center gap-1.5 px-1 ${isOutgoing ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-[#6e7a8a]">{formattedTime}</span>
          {isOutgoing && (
            <span className="text-[#5288c1]">
              {message.isRead ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
