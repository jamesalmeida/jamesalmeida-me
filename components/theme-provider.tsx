"use client";

import { bind, play, setEnabled } from "cuelume";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type Accent =
  | "grey"
  | "orange"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple";

export const ACCENTS: Accent[] = [
  "grey",
  "orange",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
];

const DEFAULT_ACCENT: Accent = "grey";
const SOUNDS_STORAGE_KEY = "jamesalmeida-sounds";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  soundsEnabled: boolean;
  toggleSounds: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("jamesalmeida-theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    const storedAccent = localStorage.getItem("jamesalmeida-accent") as Accent | null;
    if (storedAccent && ACCENTS.includes(storedAccent)) {
      setAccentState(storedAccent);
    }

    const storedSounds = localStorage.getItem(SOUNDS_STORAGE_KEY);
    const enabled = storedSounds !== "off";
    setSoundsEnabled(enabled);
    setEnabled(enabled);
    bind();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem("jamesalmeida-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Update iOS Safari theme-color meta tag for status bar / home indicator
    const themeMeta = document.getElementById("theme-color-meta");
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#0a0a0a" : "#f7f5ef");
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("jamesalmeida-accent", accent);
    document.documentElement.dataset.accent = accent;
  }, [accent, mounted]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const setAccent = (next: Accent) => {
    setAccentState(next);
  };

  const toggleSounds = () => {
    setSoundsEnabled((current) => {
      const next = !current;
      setEnabled(next);
      localStorage.setItem(SOUNDS_STORAGE_KEY, next ? "on" : "off");
      if (next) play("tick");
      return next;
    });
  };

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, accent, setAccent, soundsEnabled, toggleSounds }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
