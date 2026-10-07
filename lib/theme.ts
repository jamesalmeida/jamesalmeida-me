// Theme settings shared by components/theme-provider.tsx and the inline script in
// app/layout.tsx that applies them before first paint. Client-safe.

export type Theme = "light" | "dark";
export type Accent = "grey" | "orange" | "red" | "blue" | "green" | "yellow" | "purple";

export const ACCENTS: Accent[] = ["grey", "orange", "red", "blue", "green", "yellow", "purple"];
export const DEFAULT_ACCENT: Accent = "grey";

export const THEME_STORAGE_KEY = "jamesalmeida-theme";
export const ACCENT_STORAGE_KEY = "jamesalmeida-accent";

// iOS Safari status bar colour (the meta tag with id "theme-color-meta").
export const THEME_COLORS: Record<Theme, string> = { light: "#f7f5ef", dark: "#0a0a0a" };

// Same rules as ThemeProvider: a stored theme, else prefers-color-scheme; a known
// stored accent, else the default. Runs in <head> so there is no flash.
export const themeInitScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.classList.toggle("dark",t==="dark");var a=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});d.dataset.accent=${JSON.stringify(ACCENTS)}.indexOf(a)>-1?a:${JSON.stringify(DEFAULT_ACCENT)};var m=document.getElementById("theme-color-meta");if(m)m.setAttribute("content",${JSON.stringify(THEME_COLORS)}[t])}catch(e){}})()`;
