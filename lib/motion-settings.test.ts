import { describe, expect, it } from "vitest";
import { DEFAULT_MOTION, MOTION_LIMITS, parseMotionSetting, storedMotionOrDefault } from "./motion-settings";

describe("parseMotionSetting", () => {
  it("accepts values within the limits", () => {
    expect(parseMotionSetting({ durationScale: 1.5, minThinkingMs: 800, textCharsPerSecond: 40 })).toEqual({
      durationScale: 1.5,
      minThinkingMs: 800,
      textCharsPerSecond: 40,
    });
    expect(parseMotionSetting(DEFAULT_MOTION)).toEqual(DEFAULT_MOTION);
    expect(
      parseMotionSetting({ durationScale: MOTION_LIMITS.durationScale.max, minThinkingMs: MOTION_LIMITS.minThinkingMs.min }),
    ).not.toBeNull();
  });

  it("fills in the text speed for a setting saved before it existed", () => {
    expect(parseMotionSetting({ durationScale: 1.5, minThinkingMs: 800 })).toEqual({
      durationScale: 1.5,
      minThinkingMs: 800,
      textCharsPerSecond: DEFAULT_MOTION.textCharsPerSecond,
    });
  });

  it("rejects out-of-range, missing, extra and non-number values", () => {
    expect(parseMotionSetting({ durationScale: 10, minThinkingMs: 800 })).toBeNull();
    expect(parseMotionSetting({ durationScale: 1, minThinkingMs: -1 })).toBeNull();
    expect(parseMotionSetting({ durationScale: 1, minThinkingMs: 800, textCharsPerSecond: 5 })).toBeNull();
    expect(parseMotionSetting({ durationScale: 1, minThinkingMs: 800, textCharsPerSecond: "60" })).toBeNull();
    expect(parseMotionSetting({ durationScale: 1 })).toBeNull();
    expect(parseMotionSetting({ durationScale: 1, minThinkingMs: 800, extra: 1 })).toBeNull();
    expect(parseMotionSetting({ durationScale: "1", minThinkingMs: 800 })).toBeNull();
    expect(parseMotionSetting({ durationScale: Number.NaN, minThinkingMs: 800 })).toBeNull();
    expect(parseMotionSetting(null)).toBeNull();
  });

  it("falls back to the default for anything invalid that was stored", () => {
    expect(storedMotionOrDefault({ durationScale: 99 })).toEqual(DEFAULT_MOTION);
    expect(storedMotionOrDefault(undefined)).toEqual(DEFAULT_MOTION);
  });
});
