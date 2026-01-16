import { Timer, formatTime } from "@/hooks/useTimer";
import { X, Clock } from "lucide-react";

interface TimerDisplayProps {
  timers: Timer[];
  onRemove: (id: string) => void;
}

const TimerDisplay = ({ timers, onRemove }: TimerDisplayProps) => {
  const activeTimers = timers.filter((t) => !t.isComplete);

  if (activeTimers.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {activeTimers.map((timer) => (
        <div
          key={timer.id}
          className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-lg animate-fade-in flex items-center gap-3 min-w-[160px]"
        >
          <Clock className="w-4 h-4 text-primary animate-pulse" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground truncate max-w-[100px]">
              {timer.label}
            </div>
            <div className="text-lg font-mono font-semibold text-foreground">
              {formatTime(timer.remaining)}
            </div>
          </div>
          <button
            onClick={() => onRemove(timer.id)}
            className="p-1 hover:bg-destructive/20 rounded-full transition-colors"
            aria-label="Cancel timer"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TimerDisplay;
