"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LANDING, pickHeadline, type LandingSettings } from "@/lib/landing-settings";
import { setVisitHeadline } from "@/lib/visit";

const HEADLINE_KEY = "jamesalmeida-headline";

type Landing = LandingSettings & {
  /** This visit's headline: one of the active ones, kept for the tab session. */
  headline: string;
};

const LandingContext = createContext<Landing>({
  ...DEFAULT_LANDING,
  headline: pickHeadline(DEFAULT_LANDING, null, () => 0),
});

// Picks the visit's headline (sessionStorage, so it ends with the tab like the visit
// id) and records it in the visit context, which funnel events carry. ChatApp calls
// it during its first client render, before the landing_view event is sent.
export function chooseHeadline(settings: LandingSettings): string {
  if (typeof window === "undefined") return pickHeadline(settings, null, () => 0);
  let headline: string;
  try {
    headline = pickHeadline(settings, window.sessionStorage.getItem(HEADLINE_KEY));
    window.sessionStorage.setItem(HEADLINE_KEY, headline);
  } catch {
    headline = pickHeadline(settings);
  }
  setVisitHeadline(headline);
  return headline;
}

// The landing's headlines, examples and timing (Settings → Landing in /admin).
export function LandingSettingsProvider({
  landing,
  headline,
  children,
}: {
  landing: LandingSettings;
  headline: string;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ ...landing, headline }), [landing, headline]);
  return <LandingContext.Provider value={value}>{children}</LandingContext.Provider>;
}

export function useLanding(): Landing {
  return useContext(LandingContext);
}
