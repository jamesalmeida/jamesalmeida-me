"use client";

import { useEffect, useRef, useState } from "react";

// How much of each reply's text is on screen, by key. Module-level, because the
// first reply forks the new chat into history and remounts the thread while its
// text may still be appearing: the remount picks up where it was.
const revealed = new Map<string, number>();

/**
 * Shows `text` at most `charsPerSecond` characters a second, following it as it
 * streams in. Starts at `from` characters (0 for a new reply, text.length for a
 * restored one), unless `key` was already part shown. `done` once it's all shown.
 */
export function usePacedText(
  text: string,
  charsPerSecond: number,
  { from, key }: { from: number; key?: string | null },
) {
  const [shown, setShown] = useState(() => Math.min((key ? revealed.get(key) : undefined) ?? from, text.length));
  const position = useRef(shown);
  const length = text.length;

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
