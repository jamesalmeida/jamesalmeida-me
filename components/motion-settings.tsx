"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_MOTION, type MotionSettings } from "@/lib/motion-settings";

type Motion = MotionSettings & {
  /** A duration in seconds, scaled by the site setting. */
  seconds: (base: number) => number;
  /** A framer-motion spring that settles in about `base` seconds (scaled). */
  spring: (base: number, bounce?: number) => { type: "spring"; duration: number; bounce: number };
};

function build(settings: MotionSettings): Motion {
  return {
    ...settings,
    seconds: (base) => base * settings.durationScale,
    spring: (base, bounce = 0.2) => ({ type: "spring", duration: base * settings.durationScale, bounce }),
  };
}

const MotionContext = createContext<Motion>(build(DEFAULT_MOTION));

// The chat's pace (Settings → Motion in /admin), for every transition in the chat.
export function MotionSettingsProvider({ motion, children }: { motion?: MotionSettings; children: ReactNode }) {
  const value = useMemo(() => build(motion ?? DEFAULT_MOTION), [motion]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): Motion {
  return useContext(MotionContext);
}
