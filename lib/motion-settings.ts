// How fast the chat's transitions run, how long Skaffen always "thinks" before a
// reply shows, and how fast a reply's text appears. A site setting tuned in /admin (Settings → Motion), stored in Convex
// under MOTION_SETTING_KEY. Client-safe: the admin page and the server both use these.

export const MOTION_SETTING_KEY = "motion";

export type MotionSettings = {
  /** Multiplies every transition's duration: 1 is the default pace, 2 is twice as slow. */
  durationScale: number;
  /** Skaffen thinks for at least this long before a reply shows, even if it's ready. */
  minThinkingMs: number;
  /** A new reply's text appears at most this many characters a second. */
  textCharsPerSecond: number;
};

export const MOTION_LIMITS = {
  durationScale: { min: 0.5, max: 3, step: 0.1 },
  minThinkingMs: { min: 0, max: 4000, step: 100 },
  textCharsPerSecond: { min: 15, max: 300, step: 5 },
} as const;

export const DEFAULT_MOTION: MotionSettings = { durationScale: 1, minThinkingMs: 1200, textCharsPerSecond: 60 };

const KEYS = Object.keys(MOTION_LIMITS) as (keyof MotionSettings)[];

/**
 * Strict: numbers within MOTION_LIMITS, nothing else. Null otherwise.
 * `textCharsPerSecond` may be missing (a setting saved before it existed) and
 * takes the default.
 */
export function parseMotionSetting(input: unknown): MotionSettings | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record: Record<string, unknown> = { textCharsPerSecond: DEFAULT_MOTION.textCharsPerSecond, ...input };
  if (Object.keys(record).some((key) => !(KEYS as string[]).includes(key))) return null;
  const valid = KEYS.every((key) => {
    const value = record[key];
    const { min, max } = MOTION_LIMITS[key];
    return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
  });
  return valid
    ? {
        durationScale: record.durationScale as number,
        minThinkingMs: record.minThinkingMs as number,
        textCharsPerSecond: record.textCharsPerSecond as number,
      }
    : null;
}

export function storedMotionOrDefault(value: unknown): MotionSettings {
  return parseMotionSetting(value) ?? DEFAULT_MOTION;
}
