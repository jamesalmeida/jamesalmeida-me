import { describe, expect, it } from "vitest";
import { SITE } from "@/data/site";
import {
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_EYE_COLORS,
  AVATAR_SHAPES,
  DEFAULT_AVATAR,
  avatarStyles,
  resolveAvatarConfig,
} from "./avatar";

describe("resolveAvatarConfig", () => {
  it("keeps the site's configured avatar as is", () => {
    expect(resolveAvatarConfig(SITE.assistant.avatar)).toEqual(SITE.assistant.avatar);
  });

  it("falls back to the default for missing or unknown options", () => {
    expect(resolveAvatarConfig()).toEqual(DEFAULT_AVATAR);
    expect(
      resolveAvatarConfig({ shape: "triangle", color: 3, fill: "neon", eyes: "toString", eyeColor: null }),
    ).toEqual(DEFAULT_AVATAR);
  });

  it("accepts every listed option", () => {
    for (const shape of Object.keys(AVATAR_SHAPES)) {
      expect(resolveAvatarConfig({ shape }).shape).toBe(shape);
    }
    for (const color of Object.keys(AVATAR_COLORS)) {
      expect(resolveAvatarConfig({ color }).color).toBe(color);
    }
    for (const eyes of Object.keys(AVATAR_EYES)) {
      expect(resolveAvatarConfig({ eyes }).eyes).toBe(eyes);
    }
    for (const eyeColor of Object.keys(AVATAR_EYE_COLORS)) {
      expect(resolveAvatarConfig({ eyeColor }).eyeColor).toBe(eyeColor);
    }
    expect(resolveAvatarConfig({ fill: "solid" }).fill).toBe("solid");
  });
});

describe("avatarStyles", () => {
  it("builds the body, shine and eyes from the config", () => {
    const styles = avatarStyles({ ...DEFAULT_AVATAR, color: "clay", fill: "solid", eyeColor: "ink" });
    expect(styles.body.backgroundColor).toBe(AVATAR_COLORS.clay.value);
    expect(styles.shineOpacity).toBe(0);
    expect(styles.leftEye.backgroundColor).toBe(AVATAR_EYE_COLORS.ink.value);
    expect(styles.eyeColor).toBe(AVATAR_EYE_COLORS.ink.value);
  });

  it("gives every shape a six-point clip so shapes can morph into each other", () => {
    for (const shape of Object.keys(AVATAR_SHAPES) as (keyof typeof AVATAR_SHAPES)[]) {
      const { clipPath } = avatarStyles({ ...DEFAULT_AVATAR, shape }).body;
      expect(clipPath.match(/%,|%\)/g)?.length).toBe(6);
    }
  });
});
