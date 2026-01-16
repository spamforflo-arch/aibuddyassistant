// Local command processing - handles commands that don't need AI

export interface CommandResult {
  handled: boolean;
  response?: string;
  action?: CommandAction;
}

export interface CommandAction {
  type: "timer" | "alarm" | "open_app" | "calculate" | "time" | "date";
  payload?: Record<string, unknown>;
}

// Time and date commands
const getTimeResponse = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `It's ${displayHours}:${displayMinutes} ${period}`;
};

const getDateResponse = (): string => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return `Today is ${now.toLocaleDateString("en-US", options)}`;
};

const getDayResponse = (): string => {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  return `Today is ${day}`;
};

// Math calculation
const calculateExpression = (input: string): string | null => {
  // Extract mathematical expression from natural language
  const patterns = [
    /(?:what(?:'s| is)|calculate|compute)\s*([\d\s+\-*/().%^]+)/i,
    /(?:what(?:'s| is))\s*(\d+)\s*(?:plus|\+)\s*(\d+)/i,
    /(?:what(?:'s| is))\s*(\d+)\s*(?:minus|-)\s*(\d+)/i,
    /(?:what(?:'s| is))\s*(\d+)\s*(?:times|x|\*)\s*(\d+)/i,
    /(?:what(?:'s| is))\s*(\d+)\s*(?:divided by|\/)\s*(\d+)/i,
    /(?:what(?:'s| is))\s*(\d+)\s*(?:percent|%) (?:of)\s*(\d+)/i,
    /(\d+)\s*(?:plus|\+)\s*(\d+)/i,
    /(\d+)\s*(?:minus|-)\s*(\d+)/i,
    /(\d+)\s*(?:times|x|\*)\s*(\d+)/i,
    /(\d+)\s*(?:divided by|\/)\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      try {
        let expression = match[0]
          .replace(/what(?:'s| is)/gi, "")
          .replace(/calculate|compute/gi, "")
          .replace(/plus/gi, "+")
          .replace(/minus/gi, "-")
          .replace(/times|x/gi, "*")
          .replace(/divided by/gi, "/")
          .replace(/percent of|% of/gi, "* 0.01 *")
          .trim();

        // Safe eval using Function constructor
        const result = new Function(`return ${expression}`)();

        if (typeof result === "number" && !isNaN(result)) {
          // Format nicely
          const formatted =
            result % 1 === 0 ? result.toString() : result.toFixed(2);
          return `That's ${formatted}`;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Timer parsing
const parseTimerDuration = (
  input: string
): { minutes: number; seconds: number; label: string } | null => {
  const patterns = [
    /set (?:a )?timer (?:for )?(\d+)\s*(?:minute|min)s?(?:\s*(?:and)?\s*(\d+)\s*(?:second|sec)s?)?/i,
    /timer (?:for )?(\d+)\s*(?:minute|min)s?(?:\s*(?:and)?\s*(\d+)\s*(?:second|sec)s?)?/i,
    /(\d+)\s*(?:minute|min)s?\s*timer/i,
    /set (?:a )?timer (?:for )?(\d+)\s*(?:second|sec)s?/i,
    /(\d+)\s*(?:second|sec)s?\s*timer/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const minutes = parseInt(match[1]) || 0;
      const seconds = parseInt(match[2]) || 0;

      // Check if it's seconds-only pattern
      if (pattern.toString().includes("second") && !pattern.toString().includes("minute")) {
        return {
          minutes: 0,
          seconds: minutes, // First capture group is actually seconds
          label: `${minutes} second${minutes !== 1 ? "s" : ""}`,
        };
      }

      const parts = [];
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
      if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

      return {
        minutes,
        seconds,
        label: parts.join(" and ") || "timer",
      };
    }
  }
  return null;
};

// App opening detection
const parseAppOpen = (input: string): string | null => {
  const match = input.match(/open\s+(\w+(?:\s+\w+)?)\s*(?:app)?/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return null;
};

// Main command processor
export const processCommand = (input: string): CommandResult => {
  const lowerInput = input.toLowerCase().trim();

  // Time commands
  if (
    lowerInput.includes("what time") ||
    lowerInput.includes("current time") ||
    lowerInput === "time"
  ) {
    return {
      handled: true,
      response: getTimeResponse(),
      action: { type: "time" },
    };
  }

  // Date commands
  if (
    lowerInput.includes("what date") ||
    lowerInput.includes("today's date") ||
    lowerInput.includes("what is today") ||
    lowerInput.includes("what's today")
  ) {
    return {
      handled: true,
      response: getDateResponse(),
      action: { type: "date" },
    };
  }

  // Day command
  if (
    lowerInput.includes("what day") ||
    (lowerInput.includes("day is it") && !lowerInput.includes("date"))
  ) {
    return {
      handled: true,
      response: getDayResponse(),
      action: { type: "date" },
    };
  }

  // Math calculations
  const calcResult = calculateExpression(lowerInput);
  if (calcResult) {
    return {
      handled: true,
      response: calcResult,
      action: { type: "calculate" },
    };
  }

  // Timer commands
  const timerDuration = parseTimerDuration(lowerInput);
  if (timerDuration) {
    const totalSeconds = timerDuration.minutes * 60 + timerDuration.seconds;
    return {
      handled: true,
      response: `Setting a ${timerDuration.label} timer. I'll let you know when it's done!`,
      action: {
        type: "timer",
        payload: {
          duration: totalSeconds,
          label: timerDuration.label,
        },
      },
    };
  }

  // App opening
  const appName = parseAppOpen(lowerInput);
  if (appName) {
    return {
      handled: true,
      response: `Opening ${appName}...`,
      action: {
        type: "open_app",
        payload: { app: appName },
      },
    };
  }

  // Not a local command
  return { handled: false };
};
