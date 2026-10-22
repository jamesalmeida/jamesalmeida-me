// Skaffen's avatar options as a site setting. Client-safe: the admin page and the
// server both use these. Stored in Convex (settings table) under AVATAR_SETTING_KEY;
// SITE.assistant.avatar (data/site.ts) is the default until something is saved.
//
// agent-avatars ships as one "use client" bundle, so the server can't call its
// resolveConfig() or read SHAPES etc. The option names are copied here instead;
// lib/site-avatar.test.ts fails if they drift from the package.

import type { AvatarConfig } from "@jamesalmeida/agent-avatars";
import { SITE } from "@/data/site";

export const AVATAR_SETTING_KEY = "avatar";

export const AVATAR_OPTIONS = {
  shape: ["circle", "squircle", "pill", "blob", "drop", "hexagon"],
  color: ["slate", "teal", "ocean", "plum", "clay", "moss", "black"],
  fill: ["gradient", "solid"],
  eyes: ["round", "tall", "calm", "curious"],
  eyeColor: ["white", "cream", "mint", "ink"],
} as const;

const AVATAR_KEYS = Object.keys(AVATAR_OPTIONS) as (keyof AvatarConfig)[];
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const COLOR_KEYS: (keyof AvatarConfig)[] = ["color", "eyeColor"];

export const DEFAULT_SITE_AVATAR: AvatarConfig = SITE.assistant.avatar;

/**
 * Strict: every field present and valid for agent-avatars (presets, or hex for the
 * colours), nothing else. Returns null otherwise, so a typo is rejected instead of
 * silently falling back to a default.
 */
export function parseAvatarSetting(input: unknown): AvatarConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !(AVATAR_KEYS as string[]).includes(key))) return null;
  const valid = AVATAR_KEYS.every((key) => {
    const value = record[key];
    if (typeof value !== "string") return false;
    return (AVATAR_OPTIONS[key] as readonly string[]).includes(value) || (COLOR_KEYS.includes(key) && HEX.test(value));
  });
  return valid ? ({ ...record } as AvatarConfig) : null;
}

/** For reading what is stored: anything invalid falls back to the site default. */
export function storedAvatarOrDefault(value: unknown): AvatarConfig {
  return parseAvatarSetting(value) ?? DEFAULT_SITE_AVATAR;
}
