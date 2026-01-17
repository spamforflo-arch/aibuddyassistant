import { useState, useCallback, useEffect, useRef } from "react";

// Voice preference priorities for a calm, friendly assistant voice
const PREFERRED_VOICE_NAMES = [
  // Natural/Neural voices (best quality)
  "Google UK English Female",
  "Google US English",
  "Microsoft Aria Online (Natural)",
  "Microsoft Jenny Online (Natural)", 
  "Samantha", // iOS
  "Karen", // macOS Australian
  "Moira", // macOS Irish
  "Fiona", // macOS Scottish
  "Daniel", // iOS/macOS British
  // Fallbacks
  "Google",
  "Natural",
  "Female",
  "Aria",
  "Jenny",
];

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Find the best voice
      let bestVoice: SpeechSynthesisVoice | null = null;
      
      for (const preferredName of PREFERRED_VOICE_NAMES) {
        const found = availableVoices.find(
          (v) => v.name.includes(preferredName) && v.lang.startsWith("en")
        );
        if (found) {
          bestVoice = found;
          break;
        }
      }
      
      // Fallback to any English voice
      if (!bestVoice) {
        bestVoice = availableVoices.find((v) => v.lang.startsWith("en")) || null;
      }
      
      selectedVoiceRef.current = bestVoice;
      console.log("Selected voice:", bestVoice?.name || "default");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Calm, friendly voice settings
    utterance.rate = 0.95; // Slightly slower for calm effect
    utterance.pitch = 1.05; // Slightly higher for friendliness
    utterance.volume = 0.9;

    // Use the pre-selected best voice
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    voices,
    currentVoice: selectedVoiceRef.current?.name || "Default",
  };
};
