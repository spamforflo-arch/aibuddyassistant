import { cn } from "@/lib/utils";

interface WaveVisualizerProps {
  isActive: boolean;
  isListening?: boolean;
  className?: string;
}

const WaveVisualizer = ({ isActive, isListening, className }: WaveVisualizerProps) => {
  const bars = 9;
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Glow effect */}
      {isActive && (
        <div className="glow-ring w-48 h-48 -z-10" />
      )}
      
      {/* Wave bars */}
      <div className="wave-container h-16">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "wave-bar",
              isActive ? "animate-[wave_1.2s_ease-in-out_infinite]" : "animate-[wave-idle_2s_ease-in-out_infinite]",
              isListening && "bg-accent"
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              height: isActive ? undefined : "12px",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WaveVisualizer;
