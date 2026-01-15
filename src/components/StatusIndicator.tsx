import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "idle" | "listening" | "thinking" | "speaking";
  isSearchMode: boolean;
}

const statusMessages = {
  idle: "Tap to speak",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

const StatusIndicator = ({ status, isSearchMode }: StatusIndicatorProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            status === "idle" && "bg-muted-foreground",
            status === "listening" && "bg-accent animate-pulse",
            status === "thinking" && "bg-primary animate-pulse",
            status === "speaking" && "bg-primary"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {statusMessages[status]}
        </span>
      </div>
      
      {isSearchMode && (
        <span className="text-xs text-primary/70 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Search Mode Active
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
