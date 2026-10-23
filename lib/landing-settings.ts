// The landing's words: the headlines in the A/B test, the example prompts that
// rotate in the composer, and how often they change. A site setting edited in /admin
// (Settings → Landing), stored in Convex under LANDING_SETTING_KEY. Client-safe: the
// admin page, the chat and the server all use these. Defaults come from data/site.ts.

import { HEADLINES, PROMPT_EXAMPLES } from "@/data/site";

export const LANDING_SETTING_KEY = "landing";

export type LandingHeadlineOption = {
  text: string;
  /** In the A/B test: each visit is shown one of the active headlines. */
  active: boolean;
};

export type LandingSettings = {
  headlines: LandingHeadlineOption[];
  examples: string[];
  /** How long each example shows before the next slides in. */
  exampleIntervalMs: number;
};

export const LANDING_LIMITS = {
  headlines: { min: 1, max: 8, chars: 80 },
  examples: { min: 1, max: 20, chars: 80 },
  exampleIntervalMs: { min: 2000, max: 10000, step: 500 },
} as const;

/** The headline that first reads "What can I do for you?" before the "A" drops in. */
export const REVEAL_HEADLINE: string = HEADLINES[0];

export const DEFAULT_LANDING: LandingSettings = {
  headlines: HEADLINES.map((text, index) => ({ text, active: index === 0 })),
  examples: [...PROMPT_EXAMPLES],
  exampleIntervalMs: 4500,
};

const KEYS = ["headlines", "examples", "exampleIntervalMs"];

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text && text.length <= max ? text : null;
}

/**
 * Strict: every field, no extra keys, 1–8 headlines with at least one active, 1–20
 * examples, no blanks or duplicates, texts within LANDING_LIMITS. Whitespace is
 * collapsed. Null otherwise.
 */
export function parseLandingSetting(input: unknown): LandingSettings | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !KEYS.includes(key))) return null;

  const { headlines: headlineLimits, examples: exampleLimits, exampleIntervalMs: interval } = LANDING_LIMITS;
  if (!Array.isArray(record.headlines) || !Array.isArray(record.examples)) return null;
  if (record.headlines.length < headlineLimits.min || record.headlines.length > headlineLimits.max) return null;
  if (record.examples.length < exampleLimits.min || record.examples.length > exampleLimits.max) return null;

  const headlines: LandingHeadlineOption[] = [];
  for (const item of record.headlines) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const { text: rawText, active, ...rest } = item as Record<string, unknown>;
    const text = cleanText(rawText, headlineLimits.chars);
    if (!text || typeof active !== "boolean" || Object.keys(rest).length > 0) return null;
    headlines.push({ text, active });
  }
  const examples: string[] = [];
  for (const item of record.examples) {
    const text = cleanText(item, exampleLimits.chars);
    if (!text) return null;
    examples.push(text);
  }
  if (!headlines.some((headline) => headline.active)) return null;
  if (new Set(headlines.map((headline) => headline.text)).size !== headlines.length) return null;
  if (new Set(examples).size !== examples.length) return null;

  const ms = record.exampleIntervalMs;
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < interval.min || ms > interval.max) return null;

  return { headlines, examples, exampleIntervalMs: ms };
}

export function storedLandingOrDefault(value: unknown): LandingSettings {
  return parseLandingSetting(value) ?? DEFAULT_LANDING;
}

export function activeHeadlines(settings: LandingSettings): string[] {
  return settings.headlines.filter((headline) => headline.active).map((headline) => headline.text);
}

/**
 * The headline for a visit: the one it already has if that is still in the test,
 * else a random active one. `random` is injectable for tests.
 */
export function pickHeadline(settings: LandingSettings, current?: string | null, random = Math.random): string {
  const active = activeHeadlines(settings);
  if (current && active.includes(current)) return current;
  return active[Math.floor(random() * active.length)] ?? active[0] ?? REVEAL_HEADLINE;
}
