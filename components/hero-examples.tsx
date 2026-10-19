"use client";

import { useComposerRuntime } from "@assistant-ui/react";
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

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduceMotion;
}

const controlClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] disabled:cursor-default disabled:opacity-70";

// One index drives both the input placeholder and the example button.
export function useHeroExamples(frozen: boolean) {
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const rotating = !frozen && !userPaused && !reduceMotion;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_EXAMPLES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [rotating]);

  const go = (direction: 1 | -1) => {
    const next = (index + direction + HERO_EXAMPLES.length) % HERO_EXAMPLES.length;
    setIndex(next);
    setUserPaused(true);
    const chosen = HERO_EXAMPLES[next];
    setLiveMessage(`Example ${next + 1} of ${HERO_EXAMPLES.length}: ${chosen.prompt}`);
  };

  return {
    example: HERO_EXAMPLES[index],
    reduceMotion,
    userPaused,
    liveMessage,
    setUserPaused,
    go,
    fillMessage(prompt: string) {
      setUserPaused(true);
      setLiveMessage(`Filled the message box with: ${prompt}`);
    },
  };
}

export function HeroExampleControls({
  describedById,
  examples,
}: {
  describedById: string;
  examples: ReturnType<typeof useHeroExamples>;
}) {
  const composer = useComposerRuntime();
  const liveId = useId();
  const { example, reduceMotion, userPaused, liveMessage, setUserPaused, go, fillMessage } = examples;
  const held = userPaused || reduceMotion;

  return (
    <div className="mt-3">
      <div
        role="group"
        aria-label="Example prompts"
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
        <button
          type="button"
          onClick={() => {
            composer.setText(example.prompt);
            fillMessage(example.prompt);
          }}
          className="mx-auto block max-w-full px-2 py-1 text-center text-sm leading-5 text-[var(--muted)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline"
          aria-describedby={describedById}
        >
          {example.label}
        </button>
        <div className="mt-2 flex items-center justify-center gap-2">
          <button type="button" className={controlClass} aria-label="Previous example" onClick={() => go(-1)}>
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            type="button"
            className={controlClass}
            aria-pressed={held}
            disabled={reduceMotion}
            aria-label={
              reduceMotion
                ? "Examples stay put because reduced motion is on"
                : userPaused
                  ? "Play examples"
                  : "Pause examples"
            }
            onClick={() => setUserPaused((value) => !value)}
          >
            {held ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
          </button>
          <button type="button" className={controlClass} aria-label="Next example" onClick={() => go(1)}>
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>
      <p id={describedById} className="sr-only">
        Placeholder example: {example.prompt}. Activate this example to fill the message box.
        {reduceMotion ? " Rotation is off because reduced motion is on." : ""}
      </p>
      <p id={liveId} className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
}
