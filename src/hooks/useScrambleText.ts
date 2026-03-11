import { useState, useCallback, useRef } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:',.<>?/~`";

export function useScrambleText(text: string, duration = 200) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scramble = useCallback(() => {
    if (isScrambling) return;
    setIsScrambling(true);

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setDisplayText(text);
        setIsScrambling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const progress = elapsed / duration;
      const resolved = Math.floor(progress * text.length);
      const scrambled = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i < resolved) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      setDisplayText(scrambled);
    }, 20);
  }, [text, duration, isScrambling]);

  const reset = useCallback(() => {
    setDisplayText(text);
    setIsScrambling(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [text]);

  return { displayText, scramble, reset, isScrambling };
}
