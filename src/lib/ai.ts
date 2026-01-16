// AI response generator using Lovable AI Gateway

export interface AIResponse {
  text: string;
  action?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Stream chat response from edge function
export const streamChatResponse = async ({
  messages,
  isSearchMode,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  isSearchMode: boolean;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}): Promise<void> => {
  try {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, isSearchMode }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        onError("I'm getting too many requests right now. Give me a moment!");
        return;
      }
      if (response.status === 402) {
        onError("AI credits are running low. Please add more credits.");
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      onError(errorData.error || "Something went wrong. Please try again.");
      return;
    }

    if (!response.body) {
      onError("No response received.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process line by line
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, put back and wait for more
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Final flush
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          // Ignore
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Chat stream error:", error);
    onError("Connection error. Please check your internet and try again.");
  }
};

// Non-streaming fallback (for quick responses)
export const generateResponse = async (
  input: string,
  isSearchMode: boolean
): Promise<AIResponse> => {
  return new Promise((resolve, reject) => {
    let fullText = "";

    streamChatResponse({
      messages: [{ role: "user", content: input }],
      isSearchMode,
      onDelta: (text) => {
        fullText += text;
      },
      onDone: () => {
        resolve({ text: fullText || "I didn't catch that. Could you try again?" });
      },
      onError: (error) => {
        reject(new Error(error));
      },
    });
  });
};

export const getWakeResponse = (): string => {
  const responses = [
    "Hey, what's up?",
    "I'm awake! How can I help?",
    "Hey there! What do you need?",
    "I'm listening! What's on your mind?",
    "Ready when you are! What can I do for you?",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};
