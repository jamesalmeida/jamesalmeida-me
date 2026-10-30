// Skaffen's avatar options as a site setting: its look, and whether it reacts to
// pokes and dozes off. Client-safe: the admin page and the server both use these.
// Stored in Convex (settings table) under AVATAR_SETTING_KEY; SITE.assistant.avatar
// (data/site.ts) is the default until something is saved.
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

/** The package's MAX_SLEEP_AFTER (an hour); lib/site-avatar.test.ts checks they agree. */
export const MAX_SLEEP_AFTER = 3_600_000;

type LookKey = keyof typeof AVATAR_OPTIONS;
const LOOK_KEYS = Object.keys(AVATAR_OPTIONS) as LookKey[];
// Behaviour options (agent-avatars 0.5+). Optional, so a look saved before they
// existed still loads; missing ones come from the site default.
const BEHAVIOUR_KEYS = ["interactive", "sleepAfter"] as const;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const COLOR_KEYS: LookKey[] = ["color", "eyeColor"];

export const DEFAULT_SITE_AVATAR: AvatarConfig = SITE.assistant.avatar;

/**
 * Strict: every look field present and valid for agent-avatars (presets, or hex for
 * the colours), behaviour fields valid if present, nothing else. Returns null
 * otherwise, so a typo is rejected instead of silently falling back to a default.
 */
export function parseAvatarSetting(input: unknown): AvatarConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const known: string[] = [...LOOK_KEYS, ...BEHAVIOUR_KEYS];
  if (Object.keys(record).some((key) => !known.includes(key))) return null;
  const lookValid = LOOK_KEYS.every((key) => {
    const value = record[key];
    if (typeof value !== "string") return false;
    return (AVATAR_OPTIONS[key] as readonly string[]).includes(value) || (COLOR_KEYS.includes(key) && HEX.test(value));
  });
  const { interactive = DEFAULT_SITE_AVATAR.interactive, sleepAfter = DEFAULT_SITE_AVATAR.sleepAfter } = record;
  const behaviourValid =
    typeof interactive === "boolean" &&
    typeof sleepAfter === "number" &&
    Number.isInteger(sleepAfter) &&
    sleepAfter >= 0 &&
    sleepAfter <= MAX_SLEEP_AFTER;
  return lookValid && behaviourValid ? ({ ...record, interactive, sleepAfter } as AvatarConfig) : null;
}

/** For reading what is stored: anything invalid falls back to the site default. */
export function storedAvatarOrDefault(value: unknown): AvatarConfig {
  return parseAvatarSetting(value) ?? DEFAULT_SITE_AVATAR;
}
