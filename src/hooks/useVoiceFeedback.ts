import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "voice-feedback-enabled";

export const useVoiceFeedback = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  const lastSpokenRef = useRef<string>("");
  const lastSpokenAtRef = useRef<number>(0);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
    if (!enabled && supported) {
      window.speechSynthesis.cancel();
    }
  }, [enabled, supported]);

  // Cancel any ongoing speech on unmount
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, options?: { priority?: boolean; cooldownMs?: number }) => {
      if (!enabled || !supported || !text) return;

      const cooldown = options?.cooldownMs ?? 2500;
      const now = Date.now();

      // Avoid repeating the same message within cooldown window
      if (
        text === lastSpokenRef.current &&
        now - lastSpokenAtRef.current < cooldown
      ) {
        return;
      }

      // For non-priority messages, skip if speech is already happening
      if (!options?.priority && window.speechSynthesis.speaking) {
        return;
      }

      if (options?.priority) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = "en-US";

      lastSpokenRef.current = text;
      lastSpokenAtRef.current = now;

      window.speechSynthesis.speak(utterance);
    },
    [enabled, supported]
  );

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, supported, speak, cancel, toggle };
};
