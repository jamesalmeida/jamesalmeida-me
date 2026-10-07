"use client";

import { bind, play, setEnabled } from "cuelume";
import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useState } from "react";
import {
  ACCENTS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  type Accent,
  type Theme,
} from "@/lib/theme";

export { ACCENTS, type Accent } from "@/lib/theme";

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
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }

    const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
    const knownAccent = ACCENTS.find((option) => option === storedAccent);
    if (knownAccent) {
      setAccentState(knownAccent);
    }

    const storedSounds = localStorage.getItem(SOUNDS_STORAGE_KEY);
    const enabled = storedSounds !== "off";
    setSoundsEnabled(enabled);
    setEnabled(enabled);
    bind();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Update iOS Safari theme-color meta tag for status bar / home indicator
    const themeMeta = document.getElementById("theme-color-meta");
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_COLORS[theme]);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
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

  // The theme class is set before paint by the inline script in app/layout.tsx.
  // reducedMotion="user" turns off framer-motion transforms for prefers-reduced-motion.
  return (
    <MotionConfig reducedMotion="user">
      {mounted ? (
        <ThemeContext.Provider
          value={{ theme, toggleTheme, accent, setAccent, soundsEnabled, toggleSounds }}
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
