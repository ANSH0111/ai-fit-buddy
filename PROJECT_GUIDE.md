# AI Fitness Trainer — Project Implementation Guide

A complete, working AI-Based Virtual Fitness Coach using **Real-Time Posture Detection** (MediaPipe) and an **Interactive AI Chatbot** (Groq LLM via Supabase Edge Function), built with React + TypeScript + Lovable Cloud (Supabase).

---

## 🎯 Project Overview

This project combines:
- **Computer Vision** — MediaPipe Pose for real-time 33-landmark detection in the browser
- **Rule-based ML** — Joint-angle thresholds + state machines for form scoring and rep counting
- **Conversational AI** — Groq `llama-3.1-8b-instant` chatbot with rule-based fallback
- **Full-stack Web App** — React 18 + Vite + Tailwind + shadcn/ui frontend, Supabase (auth + Postgres + edge functions) backend

The final app implements **4 exercises**: Push-ups, Squats, Biceps Curls, and Plank — with live skeleton overlay, voice feedback, rep counting, form scoring, calorie estimation, and a personal analytics dashboard.

---

## 🧱 Final Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, React Router |
| Styling | Tailwind CSS v3, shadcn/ui, semantic HSL design tokens |
| Pose Detection | MediaPipe Pose (browser, ~30 FPS) |
| Voice | Web Speech API (`SpeechSynthesis`) |
| Auth & DB | Supabase (via Lovable Cloud) — email/password auth, Postgres with RLS |
| AI Chatbot | Groq API (`llama-3.1-8b-instant`) proxied via Supabase Edge Function |
| Theming | next-themes (light/dark mode) |

---

## 📂 Project Structure

```
src/
├── pages/
│   ├── Home.tsx              # Public landing page
│   ├── Login.tsx / Signup.tsx
│   ├── Exercises.tsx         # Exercise picker (4 exercises)
│   ├── Workout.tsx           # Active workout with detector
│   ├── Dashboard.tsx         # Personal analytics & history
│   └── ChatbotPage.tsx       # AI fitness coach chat
├── components/
│   ├── PushUpDetector.tsx    # Per-exercise MediaPipe detectors
│   ├── SquatDetector.tsx
│   ├── BicepsCurlDetector.tsx
│   ├── PlankDetector.tsx
│   ├── FullscreenExerciseOverlay.tsx
│   ├── Navbar.tsx / Footer.tsx / NavLink.tsx
│   ├── ProtectedRoute.tsx    # Auth guard
│   ├── ScrollToTop.tsx       # Auto-scroll on route change
│   └── ThemeProvider.tsx / ThemeToggle.tsx
├── contexts/
│   └── AuthContext.tsx       # Supabase session w/ self-healing
├── hooks/
│   └── useVoiceFeedback.ts   # Web Speech API wrapper
├── lib/
│   ├── chatbot.ts            # Rule-based responses + Groq invoker
│   └── saveWorkoutSession.ts # Persists session to Supabase
└── integrations/supabase/    # Auto-generated client + types

supabase/functions/groq-chat/  # Edge function proxying Groq API
```

---

## 🧠 Core Concepts

### 1. MediaPipe Pose Estimation
- Detects **33 body landmarks** per frame (`x`, `y`, `z`, `visibility`)
- Runs entirely client-side in the browser via WebAssembly
- Pipeline: `Webcam → MediaPipe → 33 Landmarks → Angle Calc → Form Check → Rep Count → Voice + UI Feedback`

### 2. Joint Angle Calculation
Used in every detector to evaluate form. Given three points A–B–C, the angle at B is:

```ts
function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return Math.acos(dot / mag) * (180 / Math.PI);
}
```

| Exercise | Key Angle | Down Threshold | Up Threshold |
|----------|-----------|----------------|--------------|
| Push-up | Shoulder–Elbow–Wrist | < 90° | > 160° |
| Squat | Hip–Knee–Ankle | < 100° | > 160° |
| Biceps Curl | Shoulder–Elbow–Wrist | < 50° | > 150° |
| Plank | Shoulder–Hip–Ankle | n/a (must stay 160°–185°) | n/a |

### 3. Rep Counting — State Machine
Each detector tracks an `up`/`down` state and increments the counter on each full transition.

### 4. Form Scoring
A running 0–100 score is updated each frame based on how close the active joint angle is to the ideal range. Out-of-range frames lower the score; clean reps raise it.

### 5. Voice Feedback (`useVoiceFeedback`)
- Uses the browser `SpeechSynthesis` API
- Toggle button cancels in-flight speech and plays a silent primer to satisfy autoplay policy
- Cooldown prevents repeating the same cue too often

### 6. AI Chatbot (Hybrid)
- **Rule-based first** (`src/lib/chatbot.ts`) — instant, no API call, covers common fitness questions
- **Groq fallback** — calls the `groq-chat` Supabase edge function with the last 10 messages and current exercise context
- Edge function injects a system prompt and forwards to `llama-3.1-8b-instant`
- The Groq API key is stored as a Supabase secret (`GROQ_API_KEY`) — never exposed to the browser

---

## 🗄️ Database Schema (Supabase)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, FK → auth.users) | |
| full_name | text | |
| created_at | timestamptz | |

### `workout_sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | RLS: user can only see their own |
| exercise_name | text | "Push-ups" / "Squats" / "Biceps Curls" / "Plank" |
| reps | int | |
| hold_time | int | seconds (Plank only) |
| form_score | int | 0–100 |
| calories_burned | numeric | estimated |
| created_at | timestamptz | |

**RLS**: Users can only `SELECT`/`INSERT` their own rows. Roles (if introduced) live in a separate `user_roles` table with a `has_role()` SECURITY DEFINER function.

### Calorie Estimation (`src/lib/saveWorkoutSession.ts`)
```
Push-ups       0.50 kcal/rep
Squats         0.32 kcal/rep
Biceps Curls   0.15 kcal/rep
Plank          0.07 kcal/second
```

---

## 🔐 Auth Flow

- Email + password sign-up/sign-in via Supabase
- `AuthContext` subscribes to `onAuthStateChange` and self-heals invalid sessions by signing out on `getSession` errors
- `ProtectedRoute` wraps Dashboard, Exercises, Workout, and Chatbot pages
- Home is publicly accessible

---

## 📊 Dashboard

Pulls the authenticated user's `workout_sessions` and computes:
- **Total Workouts** — row count
- **Average Form Score** — mean of `form_score`
- **Total Calories Burned** — sum of `calories_burned`
- **Total Reps** — sum of `reps`
- **Per-exercise breakdown** + recent session list

Stats populate after the user clicks **Stop** during a workout, which triggers `saveWorkoutSession()`.

---

## 🤖 Edge Function — `groq-chat`

Located at `supabase/functions/groq-chat/index.ts`. Responsibilities:
1. Validates incoming `{ history, currentExercise }` payload
2. Reads `GROQ_API_KEY` from Supabase secrets
3. Posts to `https://api.groq.com/openai/v1/chat/completions` with model `llama-3.1-8b-instant`
4. Returns `{ reply }` or `{ error }` with proper CORS headers

> **Why an edge function?** Keeps the API key server-side and avoids CORS/secret-leak issues. The same pattern is used (per project memory) to proxy any external service.

---

## 🎨 Design System

- HSL semantic tokens defined in `src/index.css` and `tailwind.config.ts`
- Energetic blue/teal gradients with coral accents
- Light + dark mode via `ThemeProvider`
- Fixed-height workout feedback panels to prevent layout shift
- Auto-scroll to top on route change (`ScrollToTop`)

Never use raw color classes (`bg-white`, `text-black`) — always semantic tokens (`bg-background`, `text-primary`, etc.).

---

## 🚦 Allowed Scope (per project memory)

**Exercises (4 only):** Push-ups, Squats, Biceps Curls, Plank
**Pages (3 only):** Home (public), Exercises, Dashboard (+ auth + workout + chatbot)
**Excluded:** About, Contact, Burpees, Lunges, standalone Workout page in nav

---

## ✅ Implementation Status

| Phase | Status |
|-------|--------|
| Project scaffolding & UI | ✅ Done |
| Auth (email/password) + protected routes | ✅ Done |
| Lovable Cloud (Supabase) integration | ✅ Done |
| MediaPipe pose detection | ✅ Done |
| 4 exercise detectors w/ rep + form scoring | ✅ Done |
| Voice feedback toggle | ✅ Done |
| Workout session persistence | ✅ Done |
| Personal analytics dashboard | ✅ Done |
| Groq chatbot via edge function | ✅ Done |
| Light/dark theme | ✅ Done |

---

## 🎓 Defense — Likely Questions

1. **How does MediaPipe detect 33 landmarks?** Two-stage neural net: a person detector + a pose tracker (BlazePose architecture).
2. **How do you compute joint angles?** Vector dot-product → `acos` → degrees, on 3 landmarks.
3. **Why a state machine for reps?** Avoids double-counting and only increments on a full down→up transition.
4. **Why an edge function for the chatbot?** Keeps the Groq API key secret and centralizes the system prompt.
5. **How is form score calculated?** Per-frame deviation from ideal angle range, smoothed into a 0–100 score.
6. **How is data secured?** Supabase RLS — every query is scoped to `auth.uid()`.
7. **Why rule-based + LLM hybrid for the chatbot?** Common questions answer instantly with no API cost; only novel queries hit the LLM.
8. **Limitations?** Pose accuracy degrades in poor lighting, occlusion, or side angles. Calorie estimates are approximations.

---

## 🔧 Local Notes

- `.env`, `src/integrations/supabase/client.ts`, and `src/integrations/supabase/types.ts` are **auto-generated** — do not edit
- `GROQ_API_KEY` is set as a Supabase Edge Function secret
- Dev server is managed by Lovable; manual `npm run build` is not required

---

**Status: Feature-complete and ready for defense. 🚀**
