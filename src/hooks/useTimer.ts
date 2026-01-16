import { useState, useCallback, useEffect, useRef } from "react";

export interface Timer {
  id: string;
  label: string;
  duration: number; // Total seconds
  remaining: number; // Seconds remaining
  isComplete: boolean;
  createdAt: number;
}

interface UseTimerReturn {
  timers: Timer[];
  addTimer: (duration: number, label: string) => string;
  removeTimer: (id: string) => void;
  clearAllTimers: () => void;
}

export const useTimer = (onComplete?: (timer: Timer) => void): UseTimerReturn => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const addTimer = useCallback((duration: number, label: string): string => {
    const id = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTimer: Timer = {
      id,
      label,
      duration,
      remaining: duration,
      isComplete: false,
      createdAt: Date.now(),
    };

    setTimers((prev) => [...prev, newTimer]);

    // Start countdown interval
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== id || t.isComplete) return t;

          const remaining = t.remaining - 1;

          if (remaining <= 0) {
            // Timer complete
            clearInterval(intervalsRef.current.get(id));
            intervalsRef.current.delete(id);

            const completedTimer = { ...t, remaining: 0, isComplete: true };

            // Call completion callback
            if (onCompleteRef.current) {
              setTimeout(() => onCompleteRef.current?.(completedTimer), 0);
            }

            return completedTimer;
          }

          return { ...t, remaining };
        });

        return updated;
      });
    }, 1000);

    intervalsRef.current.set(id, interval);

    return id;
  }, []);

  const removeTimer = useCallback((id: string) => {
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(id);
    }
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllTimers = useCallback(() => {
    intervalsRef.current.forEach((interval) => clearInterval(interval));
    intervalsRef.current.clear();
    setTimers([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  return {
    timers,
    addTimer,
    removeTimer,
    clearAllTimers,
  };
};

// Format seconds to MM:SS or HH:MM:SS
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
