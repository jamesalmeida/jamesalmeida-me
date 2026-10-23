import { describe, expect, it } from "vitest";
import { HEADLINES, PROMPT_EXAMPLES } from "@/data/site";
import {
  DEFAULT_LANDING,
  LANDING_LIMITS,
  REVEAL_HEADLINE,
  activeHeadlines,
  parseLandingSetting,
  pickHeadline,
  storedLandingOrDefault,
} from "./landing-settings";

const valid = {
  headlines: [
    { text: "What can AI do for you?", active: true },
    { text: "Where do you fit in a world with AI?", active: false },
  ],
  examples: ["Where do I start with AI?", "Will AI change my job?"],
  exampleIntervalMs: 4500,
};

describe("DEFAULT_LANDING", () => {
  it("comes from data/site.ts, with only the first headline in the test", () => {
    expect(DEFAULT_LANDING.headlines.map((headline) => headline.text)).toEqual([...HEADLINES]);
    expect(activeHeadlines(DEFAULT_LANDING)).toEqual([REVEAL_HEADLINE]);
    expect(DEFAULT_LANDING.examples).toEqual([...PROMPT_EXAMPLES]);
    expect(parseLandingSetting(DEFAULT_LANDING)).toEqual(DEFAULT_LANDING);
  });
});

describe("parseLandingSetting", () => {
  it("accepts a valid setting and collapses whitespace", () => {
    expect(parseLandingSetting(valid)).toEqual(valid);
    expect(
      parseLandingSetting({ ...valid, examples: ["  Where do I   start?  "] })?.examples,
    ).toEqual(["Where do I start?"]);
  });

  it("rejects blanks, duplicates, no active headline, bad timing and extra keys", () => {
    expect(parseLandingSetting({ ...valid, examples: [" "] })).toBeNull();
    expect(parseLandingSetting({ ...valid, examples: [] })).toBeNull();
    expect(parseLandingSetting({ ...valid, examples: ["Same", "Same"] })).toBeNull();
    expect(parseLandingSetting({ ...valid, examples: ["x".repeat(LANDING_LIMITS.examples.chars + 1)] })).toBeNull();
    expect(
      parseLandingSetting({ ...valid, headlines: valid.headlines.map((headline) => ({ ...headline, active: false })) }),
    ).toBeNull();
    expect(parseLandingSetting({ ...valid, headlines: [{ text: "Hi", active: true, extra: 1 }] })).toBeNull();
    expect(parseLandingSetting({ ...valid, headlines: [{ text: "Hi", active: "yes" }] })).toBeNull();
    expect(
      parseLandingSetting({ ...valid, headlines: Array.from({ length: 9 }, (_, i) => ({ text: `H${i}`, active: true })) }),
    ).toBeNull();
    expect(parseLandingSetting({ ...valid, exampleIntervalMs: 500 })).toBeNull();
    expect(parseLandingSetting({ ...valid, exampleIntervalMs: "4500" })).toBeNull();
    expect(parseLandingSetting({ ...valid, extra: true })).toBeNull();
    expect(parseLandingSetting(null)).toBeNull();
  });

  it("falls back to the default for anything invalid that was stored", () => {
    expect(storedLandingOrDefault({ headlines: [] })).toEqual(DEFAULT_LANDING);
    expect(storedLandingOrDefault(undefined)).toEqual(DEFAULT_LANDING);
  });
});

describe("pickHeadline", () => {
  const settings = {
    ...valid,
    headlines: [
      { text: "A", active: true },
      { text: "B", active: false },
      { text: "C", active: true },
    ],
  };

  it("keeps the visit's headline while it is still in the test", () => {
    expect(pickHeadline(settings, "C", () => 0)).toBe("C");
  });

  it("picks an active headline otherwise", () => {
    expect(pickHeadline(settings, "B", () => 0)).toBe("A");
    expect(pickHeadline(settings, null, () => 0.99)).toBe("C");
  });
});
