// src/lib/chatbot.ts
// Rule-based responses + Groq API fallback

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─── RULE-BASED RESPONSES (instant, no API needed) ───────────────────────────
const rules: { pattern: RegExp; response: string }[] = [
  {
    pattern: /squat/i,
    response:
      "For squats: stand feet shoulder-width apart, toes slightly out. Push hips back and down, keep chest up. Knees track over toes — don't let them cave inward. Go until thighs are parallel to the floor. Drive through your heels to stand back up. 💪",
  },
  {
    pattern: /push.?up/i,
    response:
      "For push-ups: hands slightly wider than shoulders, fingers forward. Keep your body in a straight line from head to heels — no sagging hips! Lower until chest nearly touches the floor, then push up explosively. Elbows should be at ~45° to your body, not flaring out. 🔥",
  },
  {
    pattern: /plank/i,
    response:
      "For planks: forearms on the ground, elbows under shoulders. Squeeze your core, glutes, and quads hard. Your body should form one straight line — don't let your hips sag or pike up. Breathe steadily. Start with 3 × 20 seconds and build up. ⚡",
  },
  {
    pattern: /bicep|curl/i,
    response:
      "For bicep curls: stand upright, elbows pinned to your sides. Curl the weight up by flexing your elbow — don't swing your back or shoulders. Squeeze hard at the top, then lower slowly (3 seconds down). Slow negatives build more muscle! 💪",
  },
  {
    pattern: /lunge/i,
    response:
      "For lunges: step forward with one foot, lower your back knee toward the floor (don't touch). Front knee stays over your ankle, not past your toes. Keep your torso upright. Push back through your front heel to return. Alternate legs or do all reps one side at a time. 🎯",
  },
  {
    pattern: /warm.?up|warmup/i,
    response:
      "A great 5-minute warm-up: 30s arm circles, 30s leg swings, 30s hip circles, 1min light jogging in place, 30s slow squats (bodyweight), 30s cat-cow stretches, 30s shoulder rolls. This activates blood flow and reduces injury risk! 🌡️",
  },
  {
    pattern: /cool.?down|stretch/i,
    response:
      "Cool-down stretches: hold each for 30 seconds. Quad stretch (standing, pull ankle to glute), hamstring stretch (seated reach to toes), hip flexor lunge, chest opener (clasp hands behind back), child's pose for lower back. Cool-down reduces soreness the next day! 🧘",
  },
  {
    pattern: /calorie|burn|weight.?loss/i,
    response:
      "To maximize calorie burn: combine strength training (builds muscle = burns more at rest) with HIIT cardio. A 30-min HIIT session burns 300–500 calories. Track your food intake — nutrition accounts for ~80% of weight loss. Aim for a 300–500 calorie daily deficit. 🔥",
  },
  {
    pattern: /protein|diet|nutrition|eat/i,
    response:
      "Aim for 1.6–2.2g of protein per kg of bodyweight daily. Good sources: chicken breast, eggs, Greek yogurt, lentils, tofu. Eat protein within 30–60 minutes post-workout to maximize muscle recovery. Don't skip carbs — they fuel your workouts! 🥗",
  },
  {
    pattern: /rest|recover|sore|sleep/i,
    response:
      "Recovery is when muscles actually grow! Sleep 7–9 hours per night. Take 1–2 rest days per week. For soreness: light walking, foam rolling, and contrast showers help. DOMS (delayed onset muscle soreness) peaks 24–48h after training and is totally normal. 😴",
  },
  {
    pattern: /beginner|start|new|how.*(begin|start)/i,
    response:
      "Perfect beginner plan: 3 days/week, full body. Day 1: Squat 3×10, Push-up 3×8, Plank 3×20s. Day 2: Rest. Day 3: Lunge 3×10, Bicep Curl 3×10, Plank 3×25s. Day 4: Rest. Day 5: Repeat Day 1. Add 1 rep each week. Consistency beats intensity every time! 🌱",
  },
  {
    pattern: /motivat|tired|give up|can't|lazy/i,
    response:
      "You showed up — that's already a win! 🏆 Progress isn't linear. Even a 10-minute workout beats zero. Remember: every rep is building a stronger version of you. Future you will thank you for what you're doing right now. Let's go! 💥",
  },
  {
    pattern: /form|technique|correct|mistake/i,
    response:
      "The #1 form tip: slow down and feel each muscle working. Ego-lifting with bad form builds injuries, not muscle. Use a mirror or record yourself. If something hurts (not burns — actual pain), stop immediately. Perfect form at lighter weight > sloppy form at heavy weight. 🎯",
  },
  {
    pattern: /hello|hi|hey|what can you/i,
    response:
      "Hey there! 👋 I'm your AI Fitness Coach. I can help with:\n• Exercise form & technique (squat, push-up, plank, curls, lunges)\n• Warm-ups & cool-downs\n• Nutrition & protein tips\n• Beginner workout plans\n• Motivation when you need it\n\nWhat would you like to work on today? 💪",
  },
];

export function getRuleBasedResponse(message: string): string | null {
  for (const rule of rules) {
    if (rule.pattern.test(message)) {
      return rule.response;
    }
  }
  return null;
}

// ─── GROQ API CALL ────────────────────────────────────────────────────────────
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

export interface GroqMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getGroqResponse(
  history: GroqMessage[],
  currentExercise?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    return "⚠️ No API key found. Please add VITE_GROQ_API_KEY to your .env file. Get a free key at console.groq.com";
  }

  const systemWithContext = currentExercise
    ? `${SYSTEM_PROMPT}\n\nThe user is currently doing: ${currentExercise}. Reference this exercise when relevant.`
    : SYSTEM_PROMPT;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemWithContext },
        ...history.slice(-10), // last 10 messages for context
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
  const err = await response.text();
  console.error("FULL GROQ ERROR:", err);
  throw new Error(err);
}

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "I couldn't get a response. Please try again.";
}