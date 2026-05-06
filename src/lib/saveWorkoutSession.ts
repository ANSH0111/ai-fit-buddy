import { supabase } from "@/integrations/supabase/client";

interface SaveSessionInput {
  exercise_name: string;
  reps?: number;
  hold_time?: number;
  form_score?: number;
}

// Rough calorie estimates per unit of work
const CALORIES_PER_REP: Record<string, number> = {
  "Push-ups": 0.5,
  Squats: 0.32,
  "Biceps Curls": 0.15,
};
const CALORIES_PER_SECOND_PLANK = 0.07;

export async function saveWorkoutSession({
  exercise_name,
  reps = 0,
  hold_time = 0,
  form_score = 0,
}: SaveSessionInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Skip empty sessions
    if (reps === 0 && hold_time === 0) return;

    const calories =
      exercise_name === "Plank"
        ? Math.round(hold_time * CALORIES_PER_SECOND_PLANK * 10) / 10
        : Math.round((reps * (CALORIES_PER_REP[exercise_name] ?? 0.3)) * 10) / 10;

    const { error } = await supabase.from("workout_sessions").insert({
      user_id: user.id,
      exercise_name,
      reps,
      hold_time,
      form_score,
      calories_burned: calories,
    });
    if (error) console.error("Failed to save workout session:", error);
  } catch (err) {
    console.error("saveWorkoutSession error:", err);
  }
}
