"use client";

import { AgentAvatar, EYES, type AvatarConfig, type AvatarEyes, type AvatarMood } from "@jamesalmeida/agent-avatars";
import { play } from "cuelume";
import { useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// How long a tap's trick lasts before Skaffen goes back to its own mood.
const TRICK_MS = 2600;
// One tap in this many does a spin with a hop instead of only a new face.
const SPIN_CHANCE = 0.3;
const TRICK_MOODS: AvatarMood[] = ["happy", "listening", "thinking", "writing"];
const EYE_SHAPES = Object.keys(EYES) as AvatarEyes[];

type Trick = { eyes: AvatarEyes; mood: AvatarMood };

function pick<T>(items: readonly T[], not?: T): T {
  const options = items.filter((item) => item !== not);
  return options[Math.floor(Math.random() * options.length)] ?? items[0];
}

// Skaffen's avatar as a little easter egg: tapping it swaps the eye shape and mood
// for a few seconds (and now and then spins it with a hop), then it goes back to
// `mood`. Used in the header on the landing and above the latest reply.
export function PlayfulAvatar({
  avatar,
  mood,
  size,
  className = "",
}: {
  avatar: AvatarConfig;
  mood: AvatarMood;
  size: number;
  className?: string;
}) {
  const [trick, setTrick] = useState<Trick | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [scope, animate] = useAnimate<HTMLButtonElement>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleTap = () => {
    play("tick");
    setTrick((current) => ({
      eyes: pick(EYE_SHAPES, current?.eyes ?? avatar.eyes),
      mood: pick(TRICK_MOODS, current?.mood),
    }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTrick(null), TRICK_MS);
    if (Math.random() < SPIN_CHANCE) {
      // MotionConfig reducedMotion="user" turns this off for people who asked for less motion.
      void animate(
        scope.current,
        { rotate: [0, 360], y: [0, -size * 0.3, 0] },
        { duration: 0.7, ease: [0.34, 1.3, 0.64, 1] },
      );
    }
  };

  return (
    <button
      ref={scope}
      type="button"
      onClick={handleTap}
      aria-label={`Say hi to Skaffen`}
      title="Say hi"
      className={`block shrink-0 rounded-full outline-offset-4 ${className}`}
      style={{ width: size, height: size }}
    >
      <AgentAvatar
        {...avatar}
        eyes={trick?.eyes ?? avatar.eyes}
        mood={trick?.mood ?? mood}
        size={size}
      />
    </button>
  );
}
