import { format } from "date-fns";
import { AvatarWithStatus } from "./avatar-with-status";
import { MessageWithSender } from "@shared/schema";
import { Check } from "lucide-react";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOutgoing: boolean;
  showAvatar: boolean;
}

export function MessageBubble({ message, isOutgoing, showAvatar }: MessageBubbleProps) {
  const formattedTime = format(new Date(message.createdAt), "HH:mm");
  
  return (
    <div className={`flex mb-4 message-appear ${isOutgoing ? 'justify-end' : ''}`}>
      {!isOutgoing && showAvatar ? (
        <div className="flex-shrink-0 mr-3">
          <AvatarWithStatus
            src={message.sender.profileImageUrl || null}
            name={message.sender.nickname || message.sender.username}
            size="sm"
          />
        </div>
      ) : !isOutgoing ? (
        <div className="w-11 mr-3"></div> // Spacing placeholder when avatar is not shown
      ) : null}
      
      <div className="max-w-[70%]">
        <div className={`${
          isOutgoing 
            ? 'message-out bg-primary text-white' 
            : 'message-in bg-white dark:bg-dark-700 shadow-sm dark:shadow-message text-dark-800 dark:text-light-200'
        } p-3 rounded-lg`}>
          <p>{message.content}</p>
        </div>
        <div className={`flex mt-1 items-center gap-1 ${isOutgoing ? 'justify-end' : ''}`}>
          <span className="text-xs text-dark-400 dark:text-light-500">{formattedTime}</span>
          {isOutgoing && (
            message.isRead 
              ? <span className="text-xs text-primary">
                  <Check className="h-3 w-3 inline" />
                  <Check className="h-3 w-3 inline -ml-1" />
                </span>
              : <span className="text-xs text-primary">
                  <Check className="h-3 w-3 inline" />
                </span>
          )}
        </div>
      </div>
    </div>
  );
}
