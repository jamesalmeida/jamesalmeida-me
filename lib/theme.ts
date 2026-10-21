// Theme settings shared by components/theme-provider.tsx and the inline script in
// app/layout.tsx that applies them before first paint. Client-safe.

export type Theme = "light" | "dark";
// "system" follows prefers-color-scheme.
export type ThemePreference = Theme | "system";

export const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

export const THEME_STORAGE_KEY = "jamesalmeida-theme";

// iOS Safari status bar colour (the meta tag with id "theme-color-meta").
export const THEME_COLORS: Record<Theme, string> = { light: "#f7f5ef", dark: "#0a0a0a" };

// Same rules as ThemeProvider: a stored "light" or "dark", else prefers-color-scheme.
// Runs in <head> so there is no flash.
export const themeInitScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.classList.toggle("dark",t==="dark");var m=document.getElementById("theme-color-meta");if(m)m.setAttribute("content",${JSON.stringify(THEME_COLORS)}[t])}catch(e){}})()`;
