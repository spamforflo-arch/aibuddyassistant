import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isSearchMode?: boolean;
}

const ChatMessage = ({ role, content, isSearchMode }: ChatMessageProps) => {
  const isUser = role === "user";
  
  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-secondary" : "bg-gradient-to-br from-primary to-accent"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl",
          isUser 
            ? "bg-secondary text-foreground rounded-tr-sm" 
            : "bg-card border border-border rounded-tl-sm",
          isSearchMode && !isUser && "border-primary/30"
        )}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
