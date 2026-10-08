// Groq chat proxy edge function
// Keeps the GROQ_API_KEY server-side and requires an authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert AI fitness coach integrated into a workout app that uses real-time posture detection via MediaPipe. 

Your personality: energetic, supportive, concise, and knowledgeable.

You specialize in:
- Exercise form correction (squats, push-ups, planks, bicep curls, lunges)
- Workout programming for beginners to intermediate
- Nutrition basics (protein, hydration, meal timing)
- Recovery and injury prevention
- Motivation and habit building

Rules:
- Keep responses under 120 words
- Use 1-2 relevant emojis max
- Be specific and actionable, not vague
- If asked about medical conditions, recommend seeing a doctor
- Never recommend dangerous exercises or extreme diets`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const history: ChatMessage[] = Array.isArray(body?.history)
      ? body.history
      : [];
    const currentExercise: string | undefined = body?.currentExercise;

    // Basic validation
    const safeHistory = history
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.length <= 4000,
      )
      .slice(-10);

    const systemWithContext = currentExercise
      ? `${SYSTEM_PROMPT}\n\nThe user is currently doing: ${currentExercise}. Reference this exercise when relevant.`
      : SYSTEM_PROMPT;

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemWithContext },
          ...safeHistory,
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      let safeMessage = "Groq couldn't complete this request. Please try again later.";
      try {
        const upstreamError = JSON.parse(errText)?.error;
        if (
          upstreamError?.code === "model_not_found" ||
          upstreamError?.message?.includes("does not exist or you do not have access")
        ) {
          safeMessage =
            "Groq rejected the configured model llama-3.1-8b-instant as unavailable or inaccessible. Restore access to this model in your Groq account to use open-ended AI chat.";
        } else if (groqRes.status === 401) {
          safeMessage = "Groq rejected the server API key. Update the Groq key in Lovable Cloud secrets to use open-ended AI chat.";
        } else if (groqRes.status === 429) {
          safeMessage = "Groq is rate limiting requests. Please wait a little before trying again.";
        } else if (groqRes.status >= 500) {
          safeMessage = "Groq is temporarily unavailable. Please try again later.";
        }
      } catch {
        // Keep the safe fallback when the upstream response isn't valid JSON.
      }
      return new Response(
        JSON.stringify({ error: safeMessage }),
        {
          // Preserve Groq's upstream status (for model_not_found this is a
          // terminal request error, not a gateway failure).
          status: groqRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await groqRes.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "I couldn't get a response. Please try again.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("groq-chat error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
