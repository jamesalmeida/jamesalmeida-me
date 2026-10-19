"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useId, useState } from "react";

export const HERO_EXAMPLES = [
  {
    label: "Try 'We bought ChatGPT and nothing changed'",
    prompt: "We bought ChatGPT and nothing changed",
  },
  {
    label: "Try 'Our AI pilot stalled'",
    prompt: "Our AI pilot stalled",
  },
  {
    label: "Try 'I have a project'",
    prompt: "I have a project",
  },
  {
    label: "Try 'Show me the agents you run'",
    prompt: "Show me the agents you run",
  },
] as const;

const ROTATE_MS = 4000;

const controlClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]";

// `frozen` pauses while the field is focused or already has text.
// Reduced motion does not stop the rotation; the placeholder just swaps, with no animation.
export function useHeroExamples(frozen: boolean) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [liveMessage, setLiveMessage] = useState<string>(HERO_EXAMPLES[0].label);
  const rotating = !frozen && !userPaused;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_EXAMPLES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [rotating]);

  useEffect(() => {
    setLiveMessage(HERO_EXAMPLES[index].label);
  }, [index]);

  const go = (direction: 1 | -1) => {
    setIndex((current) => (current + direction + HERO_EXAMPLES.length) % HERO_EXAMPLES.length);
  };

  return {
    example: HERO_EXAMPLES[index],
    userPaused,
    setUserPaused,
    liveMessage,
    go,
  };
}

export function HeroExampleControls({
  examples,
}: {
  examples: ReturnType<typeof useHeroExamples>;
}) {
  const liveId = useId();
  const { userPaused, liveMessage, setUserPaused, go } = examples;

  return (
    <div className="mt-3">
      <div
        role="group"
        aria-label="Example prompts"
        className="flex items-center justify-center gap-2"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            go(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(-1);
          }
        }}
      >
        <button type="button" className={controlClass} aria-label="Previous example" onClick={() => go(-1)}>
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          className={controlClass}
          aria-pressed={userPaused}
          aria-label={userPaused ? "Play examples" : "Pause examples"}
          onClick={() => setUserPaused((value) => !value)}
        >
          {userPaused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
        </button>
        <button type="button" className={controlClass} aria-label="Next example" onClick={() => go(1)}>
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
      <p id={liveId} className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
}
