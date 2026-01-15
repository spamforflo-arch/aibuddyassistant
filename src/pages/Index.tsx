import { useState, useCallback, useEffect } from "react";
import WaveVisualizer from "@/components/WaveVisualizer";
import VoiceButton from "@/components/VoiceButton";
import StatusIndicator from "@/components/StatusIndicator";
import ChatMessage from "@/components/ChatMessage";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import Header from "@/components/Header";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { generateResponse, getWakeResponse } from "@/lib/ai";
import { Radio } from "lucide-react";

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

  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  const handleUserInput = useCallback(
    async (transcript: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: transcript,
      };
      setMessages((prev) => [...prev, userMessage]);
      setStatus("thinking");

      try {
        const response = await generateResponse(transcript, isSearchMode);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.text,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (!isMuted) {
          setStatus("speaking");
          speak(response.text);
        } else {
          setStatus("idle");
        }
      } catch {
        setStatus("idle");
      }
    },
    [isSearchMode, isMuted, speak]
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
