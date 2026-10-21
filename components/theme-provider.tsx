"use client";

import { bind, play, setEnabled } from "cuelume";
import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";
import {
  THEME_COLORS,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";

export { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

const SOUNDS_STORAGE_KEY = "jamesalmeida-sounds";
const DARK_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextType {
  /** The theme in effect: the preference, or the system theme for "system". */
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  soundsEnabled: boolean;
  toggleSounds: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage may be disabled; the setting still applies for this visit.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [systemTheme, setSystemTheme] = useState<Theme>("light");
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStorage(THEME_STORAGE_KEY);
    const known = THEME_PREFERENCES.find((option) => option === stored);
    if (known) setPreferenceState(known);

    const query = window.matchMedia(DARK_QUERY);
    const updateSystemTheme = () => setSystemTheme(query.matches ? "dark" : "light");
    updateSystemTheme();
    query.addEventListener("change", updateSystemTheme);

    const enabled = readStorage(SOUNDS_STORAGE_KEY) !== "off";
    setSoundsEnabled(enabled);
    setEnabled(enabled);
    bind();

    return () => query.removeEventListener("change", updateSystemTheme);
  }, []);

  const theme = preference === "system" ? systemTheme : preference;

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    // Update iOS Safari theme-color meta tag for status bar / home indicator
    document.getElementById("theme-color-meta")?.setAttribute("content", THEME_COLORS[theme]);
  }, [theme, mounted]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    writeStorage(THEME_STORAGE_KEY, next);
  };

  const toggleSounds = () => {
    setSoundsEnabled((current) => {
      const next = !current;
      setEnabled(next);
      writeStorage(SOUNDS_STORAGE_KEY, next ? "on" : "off");
      if (next) play("tick");
      return next;
    });
  };

  // The theme class is set before paint by the inline script in app/layout.tsx.
  // reducedMotion="user" turns off framer-motion transforms for prefers-reduced-motion.
  return (
    <MotionConfig reducedMotion="user">
      {mounted ? (
        <ThemeContext.Provider
          value={{ theme, preference, setPreference, soundsEnabled, toggleSounds }}
        >
          {children}
        </ThemeContext.Provider>
      ) : (
        children
      )}
    </MotionConfig>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
