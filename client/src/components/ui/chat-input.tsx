import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, PaperclipIcon, Send } from "lucide-react";

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
    
    // Handle typing indicator
    if (newValue && !typingTimeoutRef.current) {
      onTyping(true);
      
      // Clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 3000);
    } else if (!newValue && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      onTyping(false);
    } else if (typingTimeoutRef.current) {
      // Reset the timeout on each keystroke
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 3000);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTyping(false);
      }
    };
  }, [onTyping]);

  return (
    <div className="p-4 bg-white dark:bg-dark-700 border-t border-light-500 dark:border-dark-600">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full hover:bg-light-300 dark:hover:bg-dark-600"
          aria-label="Emoji kiritish"
        >
          <Smile className="h-5 w-5 text-dark-500 dark:text-light-400" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full hover:bg-light-300 dark:hover:bg-dark-600"
          aria-label="Fayl biriktirish"
        >
          <PaperclipIcon className="h-5 w-5 text-dark-500 dark:text-light-400" />
        </Button>
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Xabar yozing..."
            className="w-full bg-light-300 dark:bg-dark-600 rounded-full py-2.5 px-4 text-dark-700 dark:text-light-300 focus:outline-none focus:ring-2 focus:ring-primary"
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            ref={inputRef}
          />
        </div>
        <Button 
          className="h-10 w-10 flex items-center justify-center bg-primary rounded-full text-white"
          disabled={!message.trim() || isSending}
          onClick={handleSend}
          aria-label="Xabar yuborish"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
