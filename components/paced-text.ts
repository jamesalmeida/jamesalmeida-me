"use client";

import { useEffect, useRef, useState } from "react";

// How much of each reply's text is on screen, by key. Module-level, so a message
// that remounts when the run finishes picks up where it was.
const revealed = new Map<string, number>();

/**
 * Shows `text` at most `charsPerSecond` characters a second, following it as it
 * streams in. Starts at `from` characters (0 for a new reply, text.length for a
 * restored one), unless `key` was already part shown. `done` once it's all shown.
 * A change to `finishSignal` shows the rest at once (the visitor pressed Stop
 * after the stream had already ended).
 */
export function usePacedText(
  text: string,
  charsPerSecond: number,
  { from, key, finishSignal = 0 }: { from: number; key?: string | null; finishSignal?: number },
) {
  const [shown, setShown] = useState(() => Math.min((key ? revealed.get(key) : undefined) ?? from, text.length));
  const position = useRef(shown);
  const length = text.length;
  const lastFinish = useRef(finishSignal);

  useEffect(() => {
    if (finishSignal === lastFinish.current) return;
    lastFinish.current = finishSignal;
    position.current = length;
    if (key) revealed.set(key, length);
    setShown(length);
  }, [finishSignal, length, key]);

  useEffect(() => {
    if (position.current >= length) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      position.current = Math.min(length, position.current + ((now - last) * charsPerSecond) / 1000);
      last = now;
      const whole = Math.floor(position.current);
      if (key) revealed.set(key, whole);
      setShown(whole);
      if (position.current < length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [length, charsPerSecond, key]);

  const visible = Math.min(shown, length);
  return { text: text.slice(0, visible), done: visible >= length };
}
