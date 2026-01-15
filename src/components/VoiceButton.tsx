import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

interface VoiceButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const VoiceButton = ({ isListening, onClick, disabled }: VoiceButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
        "bg-gradient-to-br from-primary to-accent",
        "hover:scale-105 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isListening && "animate-pulse"
      )}
      style={{
        boxShadow: isListening 
          ? "0 0 60px hsl(210 100% 65% / 0.5), 0 0 100px hsl(200 80% 60% / 0.3)" 
          : "0 0 30px hsl(210 100% 65% / 0.3)"
      }}
    >
      {/* Ripple effect when listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          <span className="absolute inset-[-8px] rounded-full border-2 border-primary/50 animate-pulse" />
        </>
      )}
      
      {isListening ? (
        <MicOff className="w-8 h-8 text-primary-foreground relative z-10" />
      ) : (
        <Mic className="w-8 h-8 text-primary-foreground relative z-10" />
      )}
    </button>
  );
};

export default VoiceButton;
