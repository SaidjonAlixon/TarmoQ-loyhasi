import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Paperclip, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ onSend, onTyping }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    const success = await onSend(message);
    
    if (success) {
      setMessage("");
      inputRef.current?.focus();
    }
    
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    if (newValue && !typingTimeoutRef.current) {
      onTyping(true);
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 3000);
    } else if (!newValue && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      onTyping(false);
    } else if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping(false);
      }
    };
  }, [onTyping]);

  return (
    <div className="h-16 bg-[#17212b] border-t border-[#242f3d] flex items-center gap-2 px-4 flex-shrink-0">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a] flex-shrink-0"
        aria-label="Emoji kiritish"
      >
        <Smile className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-9 w-9 rounded-full hover:bg-[#242f3d] text-[#6e7a8a] flex-shrink-0"
        aria-label="Fayl biriktirish"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder="Xabar yozing..."
          className="w-full bg-[#242f3d] border-0 rounded-full py-2.5 px-4 text-white placeholder:text-[#6e7a8a] focus:ring-1 focus:ring-[#5288c1] focus:outline-none"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
        />
      </div>
      <Button 
        className="h-9 w-9 flex items-center justify-center bg-[#5288c1] hover:bg-[#4a7ab8] rounded-full text-white flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!message.trim() || isSending}
        onClick={handleSend}
        aria-label="Xabar yuborish"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
