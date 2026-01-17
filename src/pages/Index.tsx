import { useState, useCallback, useEffect, useRef } from "react";
import WaveVisualizer from "@/components/WaveVisualizer";
import VoiceButton from "@/components/VoiceButton";
import StatusIndicator from "@/components/StatusIndicator";
import ChatMessage from "@/components/ChatMessage";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import Header from "@/components/Header";
import TimerDisplay from "@/components/TimerDisplay";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useTimer, Timer } from "@/hooks/useTimer";
import { streamChatResponse, getWakeResponse } from "@/lib/ai";
import { processCommand } from "@/lib/commands";
import { openApp, initNative } from "@/lib/native";
import { Radio } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type Status = "idle" | "listening" | "thinking" | "speaking";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);
  const conversationRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  // Initialize native capabilities
  useEffect(() => {
    initNative();
  }, []);

  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  // Timer completion handler
  const handleTimerComplete = useCallback(
    (timer: Timer) => {
      const message = `Your ${timer.label} timer is done!`;
      toast.success(message, { duration: 5000 });

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (!isMuted) {
        speak(message);
      }

      // Try to play notification sound
      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {
          // Fallback: use Web Audio API for a beep
          const ctx = new AudioContext();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.connect(gain);
          gain.connect(ctx.destination);
          oscillator.frequency.value = 800;
          gain.gain.value = 0.3;
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            ctx.close();
          }, 300);
        });
      } catch {
        // Silent fallback
      }
    },
    [isMuted, speak]
  );

  const { timers, addTimer, removeTimer } = useTimer(handleTimerComplete);

  const handleUserInput = useCallback(
    async (transcript: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: transcript,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Check for local commands first
      const commandResult = processCommand(transcript);

      if (commandResult.handled && commandResult.response) {
        // Handle timer action
        if (commandResult.action?.type === "timer" && commandResult.action.payload) {
          const { duration, label } = commandResult.action.payload as {
            duration: number;
            label: string;
          };
          addTimer(duration, label);
        }

        // Handle app opening (uses native deep links on mobile)
        if (commandResult.action?.type === "open_app" && commandResult.action.payload) {
          const app = (commandResult.action.payload as { app: string }).app;
          openApp(app);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: commandResult.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (!isMuted) {
          setStatus("speaking");
          speak(commandResult.response);
        } else {
          setStatus("idle");
        }
        return;
      }

      // Use AI for non-command queries
      setStatus("thinking");

      // Update conversation history
      conversationRef.current.push({ role: "user", content: transcript });

      // Create placeholder for streaming response
      const assistantId = (Date.now() + 1).toString();
      let fullResponse = "";

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      await streamChatResponse({
        messages: conversationRef.current,
        isSearchMode,
        onDelta: (text) => {
          fullResponse += text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullResponse } : m
            )
          );
        },
        onDone: () => {
          conversationRef.current.push({ role: "assistant", content: fullResponse });

          if (!isMuted && fullResponse) {
            setStatus("speaking");
            speak(fullResponse);
          } else {
            setStatus("idle");
          }
        },
        onError: (error) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: error } : m
            )
          );
          setStatus("idle");
          toast.error(error);
        },
      });
    },
    [isSearchMode, isMuted, speak, addTimer]
  );

  const handleWakeWord = useCallback(() => {
    const response = getWakeResponse();
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: response,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    if (!isMuted) {
      setStatus("speaking");
      speak(response);
    }

    // Start listening after wake response
    setTimeout(() => {
      startListening();
    }, 1500);
  }, [isMuted, speak]);

  const {
    isListening,
    isSupported,
    isWakeWordListening,
    startListening,
    stopListening,
    startWakeWordListening,
    stopWakeWordListening,
  } = useSpeechRecognition({
    onResult: handleUserInput,
    onWakeWord: handleWakeWord,
  });

  // Update status based on speech synthesis
  useEffect(() => {
    if (!isSpeaking && status === "speaking") {
      setStatus("idle");
    }
  }, [isSpeaking, status]);

  // Update status based on listening state
  useEffect(() => {
    if (isListening) {
      setStatus("listening");
    }
  }, [isListening]);

  const handleVoiceButtonClick = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      setStatus("idle");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isSpeaking, startListening, stopListening, stopSpeaking]);

  const toggleWakeWord = useCallback(() => {
    if (isWakeWordEnabled) {
      stopWakeWordListening();
      setIsWakeWordEnabled(false);
    } else {
      startWakeWordListening();
      setIsWakeWordEnabled(true);
    }
  }, [isWakeWordEnabled, startWakeWordListening, stopWakeWordListening]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BackgroundOrbs />
      <TimerDisplay timers={timers} onRemove={removeTimer} />

      <Header
        isSearchMode={isSearchMode}
        onToggleMode={() => setIsSearchMode(!isSearchMode)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-lg mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <h1 className="text-2xl font-semibold mb-2">Buddy AI</h1>
              <p className="text-muted-foreground text-sm">
                Your voice assistant. Say "Yo buddy, wake up!" or tap the mic.
              </p>
              <div className="mt-6 text-xs text-muted-foreground/70 space-y-1">
                <p>Try: "What time is it?" • "Set a timer for 5 minutes"</p>
                <p>"Calculate 25 times 4" • "Open YouTube"</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isSearchMode={isSearchMode}
            />
          ))}
        </div>
      </div>

      {/* Voice interface */}
      <div className="flex flex-col items-center pb-8 pt-4 gap-6">
        <WaveVisualizer
          isActive={status === "listening" || status === "speaking"}
          isListening={status === "listening"}
        />

        <VoiceButton
          isListening={isListening}
          onClick={handleVoiceButtonClick}
          disabled={!isSupported}
        />

        <StatusIndicator status={status} isSearchMode={isSearchMode} />

        {/* Wake word toggle */}
        <button
          onClick={toggleWakeWord}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
            isWakeWordEnabled
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-secondary text-muted-foreground hover:bg-muted"
          }`}
        >
          <Radio className={`w-4 h-4 ${isWakeWordEnabled ? "animate-pulse" : ""}`} />
          {isWakeWordEnabled ? "Wake word active" : "Enable wake word"}
        </button>

        {!isSupported && (
          <p className="text-destructive text-xs">
            Speech recognition not supported in this browser
          </p>
        )}
      </div>
    </div>
  );
};

export default Index;
