import { useState, useCallback, useEffect, useRef } from "react";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
  onWakeWord?: () => void;
  wakePhrase?: string;
}

export const useSpeechRecognition = ({
  onResult,
  onWakeWord,
  wakePhrase = "yo buddy wake up",
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      // Main recognition
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Wake word recognition
      wakeRecognitionRef.current = new SpeechRecognitionAPI();
      wakeRecognitionRef.current.continuous = true;
      wakeRecognitionRef.current.interimResults = true;
      wakeRecognitionRef.current.lang = "en-US";

      wakeRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
          .toLowerCase();

        if (transcript.includes(wakePhrase.toLowerCase()) || 
            transcript.includes("yo buddy") ||
            transcript.includes("hey buddy")) {
          stopWakeWordListening();
          onWakeWord?.();
        }
      };

      wakeRecognitionRef.current.onerror = () => {
        setIsWakeWordListening(false);
      };
    }

    return () => {
      recognitionRef.current?.abort();
      wakeRecognitionRef.current?.abort();
    };
  }, [onResult, onWakeWord, wakePhrase]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const startWakeWordListening = useCallback(() => {
    if (wakeRecognitionRef.current && !isWakeWordListening) {
      try {
        wakeRecognitionRef.current.start();
        setIsWakeWordListening(true);
      } catch (e) {
        console.error("Wake word recognition error:", e);
      }
    }
  }, [isWakeWordListening]);

  const stopWakeWordListening = useCallback(() => {
    if (wakeRecognitionRef.current) {
      wakeRecognitionRef.current.stop();
      setIsWakeWordListening(false);
    }
  }, []);

  return {
    isListening,
    isSupported,
    isWakeWordListening,
    startListening,
    stopListening,
    startWakeWordListening,
    stopWakeWordListening,
  };
};
