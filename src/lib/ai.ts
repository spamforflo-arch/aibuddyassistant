// Simple AI response generator (client-side, no API needed)
// For production, connect to OpenAI/Claude via Supabase Edge Functions

interface AIResponse {
  text: string;
  action?: string;
}

const simpleResponses: Record<string, string> = {
  hello: "Hey! What's up? How can I help you today?",
  hi: "Hey there! Ready to help. What do you need?",
  "how are you": "I'm doing great, thanks for asking! What can I do for you?",
  "what time": `It's currently ${new Date().toLocaleTimeString()}`,
  "what day": `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
  weather: "I'd need search mode enabled to get real weather data. Want me to turn it on?",
  thanks: "You're welcome! Let me know if you need anything else.",
  bye: "See you later! Have a great day!",
};

const actionPatterns = [
  { pattern: /open spotify/i, action: "open_spotify", response: "Opening Spotify for you!" },
  { pattern: /play .+ on spotify/i, action: "play_spotify", response: "I'll try to play that on Spotify!" },
  { pattern: /set.* alarm.* (\d+)/i, action: "set_alarm", response: "Setting an alarm for you!" },
  { pattern: /set.* reminder/i, action: "set_reminder", response: "I'll set that reminder!" },
  { pattern: /open (.+) app/i, action: "open_app", response: "Opening the app for you!" },
  { pattern: /call (.+)/i, action: "make_call", response: "Initiating the call..." },
  { pattern: /send message/i, action: "send_message", response: "Let me help you send that message." },
  { pattern: /take.* photo/i, action: "take_photo", response: "Opening camera..." },
  { pattern: /turn on.* flashlight/i, action: "flashlight_on", response: "Turning on the flashlight!" },
  { pattern: /turn off.* flashlight/i, action: "flashlight_off", response: "Turning off the flashlight." },
];

const searchModeResponses = [
  "Let me search for that information...",
  "Searching the web for accurate data...",
  "Analyzing multiple sources to get you the best answer...",
];

export const generateResponse = async (
  input: string,
  isSearchMode: boolean
): Promise<AIResponse> => {
  const lowerInput = input.toLowerCase().trim();

  // Check for actions first
  for (const { pattern, action, response } of actionPatterns) {
    if (pattern.test(lowerInput)) {
      return { text: response, action };
    }
  }

  // Check simple responses
  for (const [key, response] of Object.entries(simpleResponses)) {
    if (lowerInput.includes(key)) {
      return { text: response };
    }
  }

  // Search mode enhanced responses
  if (isSearchMode) {
    const searchPrefix = searchModeResponses[Math.floor(Math.random() * searchModeResponses.length)];
    
    // Simulate more intelligent response in search mode
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return {
      text: `${searchPrefix} Based on my search, I found relevant information about "${input}". In search mode, I can access real-time data and provide more comprehensive answers. Try asking me about current events, detailed topics, or complex questions!`,
    };
  }

  // Default response
  const defaultResponses = [
    `I understand you're asking about "${input}". For more detailed answers, try enabling Search mode!`,
    "I'm here to help! Could you tell me more about what you need?",
    "Interesting question! Enable Search mode for more comprehensive answers.",
    "I'd be happy to help with that. What specific information do you need?",
  ];

  return {
    text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
  };
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
