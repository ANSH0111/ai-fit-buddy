

## Plan: Fullscreen Webcam + Perfect Posture Gate for Rep Counting

### What changes

**1. Fullscreen webcam overlay when detection is active**

When the user clicks "Start Detection" on any exercise, the webcam view will go fullscreen (fixed overlay covering the entire screen). Stats (reps/timer, form score, phase) and controls (Stop, Reset) will be rendered as floating overlays on top of the video — compact and semi-transparent so they don't block the view. The feedback panel and tips will be hidden during fullscreen; only key feedback messages will appear as brief toast-like overlays on the video.

**2. "Perfect posture gate" before counting begins**

Each detector will add a pre-counting state. When detection starts, the user sees a "Get into position" prompt overlaid on the video. Reps/timer only begin counting once the user achieves and holds good form for ~2 seconds (a "ready" confirmation). A visual indicator (e.g., green border or "Ready!" badge) will confirm they're in position.

- **Push-ups**: Must have straight torso (>=140°) and arms extended (>145°) for 2s
- **Squats**: Must be standing upright (knee angle >155°) with good torso alignment for 2s
- **Biceps Curls**: Must have arms extended (~170°) with elbows pinned and no sway for 2s
- **Plank**: Already gates the timer on good form; will add an explicit "Position confirmed" state before the timer starts

### Files to modify

| File | Change |
|---|---|
| `src/components/PushUpDetector.tsx` | Fullscreen layout when active; add `isReady` state with 2s good-posture gate before rep counting |
| `src/components/SquatDetector.tsx` | Same fullscreen + posture gate pattern |
| `src/components/BicepsCurlDetector.tsx` | Same fullscreen + posture gate pattern |
| `src/components/PlankDetector.tsx` | Same fullscreen layout; add explicit "Position confirmed" overlay before timer starts |

### UI layout when active (all detectors)

```text
┌──────────────────────────────────┐
│  [fixed fullscreen overlay]      │
│                                  │
│  ┌─────────────────────────┐     │
│  │  Canvas (pose skeleton) │     │
│  │                         │     │
│  │  ┌──────────────────┐   │     │
│  │  │ "Get into position"│  │  ← shown until ready
│  │  │  or "Ready! Go!"  │  │     │
│  │  └──────────────────┘   │     │
│  │                         │     │
│  └─────────────────────────┘     │
│                                  │
│  [floating top-right]            │
│   Reps: 5  |  Score: 95%        │
│                                  │
│  [floating bottom-center]        │
│   [Stop] [Reset]                 │
│                                  │
│  [floating bottom-left]          │
│   Latest feedback message        │
└──────────────────────────────────┘
```

### Technical approach

- Each detector wraps the active state in a `fixed inset-0 z-50 bg-black` container
- Canvas fills the screen with `object-contain` to maintain aspect ratio
- Stats rendered as `absolute` positioned semi-transparent badges
- New `isReady` ref + state tracks whether the user held good starting posture for 2 seconds
- `readyTimerRef` tracks when good posture started; once `Date.now() - readyTimerRef > 2000`, set `isReady = true` and allow rep counting / timer
- If posture breaks before 2s, reset the ready timer

