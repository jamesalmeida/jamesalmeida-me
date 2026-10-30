"use client";

import {
  AgentAvatar,
  EYES,
  useGesture,
  type AvatarConfig,
  type AvatarEyes,
  type AvatarGesture,
  type AvatarMood,
} from "@jamesalmeida/agent-avatars";
import { play } from "cuelume";
import { useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMotion } from "./motion-settings";

// How long a tap's trick lasts before Skaffen goes back to its own mood.
const TRICK_MS = 2600;
const TRICK_MOODS: AvatarMood[] = [
  "happy",
  "love",
  "surprised",
  "confused",
  "dizzy",
  "thinking",
  "searching",
  "listening",
  "writing",
];
// The package's gestures; its turn ("spin") is its own trick below.
const TRICK_GESTURES: AvatarGesture[] = ["nod", "shake", "wink", "jump", "wiggle", "peek"];
const EYE_SHAPES = Object.keys(EYES) as AvatarEyes[];

type Trick = { eyes: AvatarEyes; mood: AvatarMood };

function pick<T>(items: readonly T[], not?: T): T {
  const options = items.filter((item) => item !== not);
  return options[Math.floor(Math.random() * options.length)] ?? items[0];
}

// Skaffen's avatar as a little easter egg: tapping it swaps the eye shape and mood
// for a few seconds, then it goes back to `mood`. Some taps also move it: a flat
// spin with a hop (20%), a turn: the eyes wind up, slide off one side of the body
// and come back from the other (the package's `spin`, 15%), or one of the
// package's gestures: nod, shake, wink, jump, wiggle or peek (35%). Reduced motion
// drops the movement. With the avatar setting's `interactive`, the press itself
// also squashes it (a poke), and stroking it makes it happy.
export function PlayfulAvatar({
  avatar,
  mood,
  size,
  speaking = false,
  className = "",
}: {
  avatar: AvatarConfig;
  mood: AvatarMood;
  size: number;
  speaking?: boolean;
  className?: string;
}) {
  const [trick, setTrick] = useState<Trick | null>(null);
  const [turns, setTurns] = useState(0);
  const [gesture, playGesture] = useGesture();
  const timer = useRef<number | undefined>(undefined);
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const { seconds } = useMotion();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleTap = () => {
    play("tick");
    setTrick((current) => ({
      eyes: pick(EYE_SHAPES, current?.eyes ?? avatar.eyes),
      mood: pick(TRICK_MOODS, current?.mood),
    }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTrick(null), TRICK_MS);

    const roll = Math.random();
    if (roll < 0.2) {
      // A flat spin with a hop.
      void animate(
        scope.current,
        { rotate: [0, 360], y: [0, -size * 0.3, 0] },
        { duration: seconds(0.9), ease: [0.34, 1.3, 0.64, 1] },
      );
    } else if (roll < 0.35) {
      setTurns((count) => count + 1);
    } else if (roll < 0.7) {
      playGesture(pick(TRICK_GESTURES));
    }
  };

  return (
    <button
      ref={scope}
      type="button"
      onClick={handleTap}
      aria-label="Say hi to Skaffen"
      title="Say hi"
      className={`block shrink-0 rounded-full outline-offset-4 ${className}`}
      style={{ width: size, height: size }}
    >
      <AgentAvatar
        {...avatar}
        eyes={trick?.eyes ?? avatar.eyes}
        mood={trick?.mood ?? mood}
        size={size}
        // While idle, the eyes follow the mouse when it comes close and look at
        // whatever has focus (the composer, a button). The outline only shows in dark
        // mode (--aa-outline-color in globals.css), so a dark avatar stays visible.
        followPointer
        followFocus
        outline
        spin={turns}
        spinMs={seconds(1.1) * 1000}
        gesture={gesture}
        speaking={speaking}
      />
    </button>
  );
}

// Skaffen at its one size: 56 px, scaled to 52 px on phones with CSS (so the server
// render and the first client render agree). The header and the reply both use it.
export function SkaffenAvatar({ avatar, mood, speaking }: { avatar: AvatarConfig; mood: AvatarMood; speaking?: boolean }) {
  return (
    <span className="block h-13 w-13 shrink-0 sm:h-14 sm:w-14">
      <span className="block origin-top-left scale-[0.9286] sm:scale-100">
        <PlayfulAvatar avatar={avatar} mood={mood} size={56} speaking={speaking} />
      </span>
    </span>
  );
}
