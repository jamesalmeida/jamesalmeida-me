import { COLORS, EYES, EYE_COLORS, MAX_SLEEP_AFTER as PACKAGE_MAX_SLEEP_AFTER, SHAPES, resolveConfig } from "@jamesalmeida/agent-avatars";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "@/data/site";
import {
  AVATAR_OPTIONS,
  DEFAULT_SITE_AVATAR,
  MAX_SLEEP_AFTER,
  parseAvatarSetting,
  storedAvatarOrDefault,
} from "@/lib/avatar-settings";
import { getSiteAvatar } from "@/lib/avatar-settings.server";

describe("SITE.assistant.avatar", () => {
  it("only uses options agent-avatars knows (unknown ones would silently fall back)", () => {
    expect(resolveConfig(SITE.assistant.avatar)).toEqual(SITE.assistant.avatar);
  });
});

describe("AVATAR_OPTIONS", () => {
  it("matches the options agent-avatars knows", () => {
    expect(AVATAR_OPTIONS.shape).toEqual(Object.keys(SHAPES));
    expect(AVATAR_OPTIONS.color).toEqual(Object.keys(COLORS));
    expect(AVATAR_OPTIONS.eyes).toEqual(Object.keys(EYES));
    expect(AVATAR_OPTIONS.eyeColor).toEqual(Object.keys(EYE_COLORS));
    expect(MAX_SLEEP_AFTER).toBe(PACKAGE_MAX_SLEEP_AFTER);
  });
});

describe("parseAvatarSetting", () => {
  const valid = { shape: "pill", color: "#ff8800", fill: "solid", eyes: "calm", eyeColor: "ink", interactive: false, sleepAfter: 30_000 };
  // A look saved before the behaviour options existed.
  const { interactive: _interactive, sleepAfter: _sleepAfter, ...lookOnly } = valid;

  it("accepts presets and hex colours", () => {
    expect(parseAvatarSetting(valid)).toEqual(valid);
    expect(parseAvatarSetting(DEFAULT_SITE_AVATAR)).toEqual(DEFAULT_SITE_AVATAR);
  });

  it("fills missing behaviour options from the site default, so an older saved look still loads", () => {
    expect(parseAvatarSetting(lookOnly)).toEqual({
      ...lookOnly,
      interactive: DEFAULT_SITE_AVATAR.interactive,
      sleepAfter: DEFAULT_SITE_AVATAR.sleepAfter,
    });
  });

  it("rejects bad behaviour options", () => {
    expect(parseAvatarSetting({ ...valid, interactive: "yes" })).toBeNull();
    expect(parseAvatarSetting({ ...valid, sleepAfter: -1 })).toBeNull();
    expect(parseAvatarSetting({ ...valid, sleepAfter: MAX_SLEEP_AFTER + 1 })).toBeNull();
    expect(parseAvatarSetting({ ...valid, sleepAfter: 1.5 })).toBeNull();
    expect(parseAvatarSetting({ ...valid, sleepAfter: "60000" })).toBeNull();
  });

  it("rejects unknown values, missing or extra keys, and non-objects", () => {
    expect(parseAvatarSetting({ ...valid, shape: "star" })).toBeNull();
    expect(parseAvatarSetting({ ...valid, color: "red; background: url(x)" })).toBeNull();
    expect(parseAvatarSetting({ ...valid, extra: "x" })).toBeNull();
    expect(parseAvatarSetting({ ...valid, fill: "#ffffff" })).toBeNull();
    const { eyes: _eyes, ...missing } = valid;
    expect(parseAvatarSetting(missing)).toBeNull();
    expect(parseAvatarSetting(null)).toBeNull();
    expect(parseAvatarSetting([valid])).toBeNull();
    expect(parseAvatarSetting("pill")).toBeNull();
  });

  it("agrees with resolveConfig on what is valid", () => {
    expect(resolveConfig(valid)).toEqual(parseAvatarSetting(valid));
  });

  it("falls back to the site default when what is stored is invalid", () => {
    expect(storedAvatarOrDefault({ shape: 1 })).toEqual(DEFAULT_SITE_AVATAR);
    expect(storedAvatarOrDefault(valid)).toEqual(valid);
  });
});

describe("getSiteAvatar", () => {
  it("uses the default when storage isn't configured", async () => {
    vi.stubEnv("CONVEX_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
    vi.stubEnv("CONVEX_SERVER_SECRET", "");
    await expect(getSiteAvatar()).resolves.toEqual({ avatar: DEFAULT_SITE_AVATAR, source: "default" });
    vi.unstubAllEnvs();
  });
});
