import { cn } from "@/lib/utils";
import { Zap, Brain } from "lucide-react";

interface ModeToggleProps {
  isSearchMode: boolean;
  onToggle: () => void;
}

const ModeToggle = ({ isSearchMode, onToggle }: ModeToggleProps) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-secondary rounded-full">
      <button
        onClick={() => !isSearchMode || onToggle()}
        className={cn(
          "mode-pill flex items-center gap-2",
          !isSearchMode ? "mode-pill-active" : "mode-pill-inactive"
        )}
      >
        <Brain className="w-4 h-4" />
        <span>Simple</span>
      </button>
      <button
        onClick={() => isSearchMode || onToggle()}
        className={cn(
          "mode-pill flex items-center gap-2",
          isSearchMode ? "mode-pill-active" : "mode-pill-inactive"
        )}
      >
        <Zap className="w-4 h-4" />
        <span>Search</span>
      </button>
    </div>
  );
};

export default ModeToggle;
