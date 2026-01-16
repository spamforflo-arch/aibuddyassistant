import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIMPLE_MODE_PROMPT = `You are Buddy, a friendly and efficient voice assistant. Your responses should be:
- Brief and conversational (1-3 sentences max)
- Natural and friendly, like talking to a helpful friend
- Direct and to the point
- Easy to listen to when spoken aloud

Avoid:
- Long explanations or lists
- Technical jargon unless asked
- Starting with "I" too often
- Excessive pleasantries

Examples of good responses:
- "Paris is the capital of France!"
- "Sure thing! A light year is the distance light travels in one year, about 6 trillion miles."
- "The weather looks great today - perfect for a walk!"`;

const SEARCH_MODE_PROMPT = `You are Buddy, an advanced AI assistant with deep knowledge and analytical capabilities. In Search Mode, you provide:
- Comprehensive, detailed responses
- Multiple perspectives and thorough analysis
- Step-by-step explanations when helpful
- Examples, context, and related information
- Sources of information when relevant

Your goal is to be as helpful and informative as possible, giving the user a complete understanding of their question. Think carefully and provide well-structured responses.

Format guidelines:
- Use clear paragraphs for different points
- Include relevant examples
- Explain technical concepts in accessible ways
- Offer additional context the user might find valuable`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, isSearchMode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = isSearchMode ? SEARCH_MODE_PROMPT : SIMPLE_MODE_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
