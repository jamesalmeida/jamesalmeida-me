// Skaffen's avatar: shapes, colours and eyes, and the inline styles they produce.
// Client-safe. The chosen options live in SITE.assistant.avatar (data/site.ts).
// Geometry is drawn on a 200 px stage and scaled down by the component.

export const AVATAR_STAGE = 200;

// Every shape clips with the same six points, so a change to or from the
// hexagon morphs instead of snapping.
const FULL_CLIP = "polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%)";

export const AVATAR_SHAPES = {
  circle: { label: "Circle", w: 150, h: 150, radius: "50%", clip: FULL_CLIP, rotate: "none", eyeY: 0 },
  squircle: { label: "Squircle", w: 150, h: 150, radius: "38%", clip: FULL_CLIP, rotate: "none", eyeY: 0 },
  pill: { label: "Pill", w: 180, h: 116, radius: "999px", clip: FULL_CLIP, rotate: "none", eyeY: 0 },
  blob: {
    label: "Blob",
    w: 158,
    h: 146,
    radius: "58% 42% 55% 45% / 50% 58% 42% 50%",
    clip: FULL_CLIP,
    rotate: "none",
    eyeY: 2,
  },
  drop: { label: "Drop", w: 120, h: 120, radius: "0 50% 50% 50%", clip: FULL_CLIP, rotate: "rotate(45deg)", eyeY: 10 },
  hexagon: {
    label: "Hexagon",
    w: 162,
    h: 146,
    radius: "0",
    clip: "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)",
    rotate: "none",
    eyeY: 0,
  },
} as const;

export const AVATAR_COLORS = {
  slate: { label: "Slate", value: "#2f4858" },
  teal: { label: "Teal", value: "#2f6f6a" },
  ocean: { label: "Ocean", value: "#2c6fb5" },
  plum: { label: "Plum", value: "#5b4a6e" },
  clay: { label: "Clay", value: "#b8664a" },
  moss: { label: "Moss", value: "#4f7a3a" },
} as const;

export const AVATAR_EYE_COLORS = {
  white: { label: "White", value: "#ffffff" },
  cream: { label: "Cream", value: "#f6efe1" },
  mint: { label: "Mint", value: "#c9f0e0" },
  ink: { label: "Ink", value: "#14202a" },
} as const;

type EyeDot = { w: number; h: number; r: string };

export const AVATAR_EYES: Record<string, { label: string; gap: number; left: EyeDot; right: EyeDot }> = {
  round: { label: "Round", gap: 26, left: { w: 26, h: 26, r: "50%" }, right: { w: 26, h: 26, r: "50%" } },
  tall: { label: "Tall", gap: 26, left: { w: 20, h: 36, r: "10px" }, right: { w: 20, h: 36, r: "10px" } },
  calm: { label: "Calm", gap: 20, left: { w: 30, h: 10, r: "5px" }, right: { w: 30, h: 10, r: "5px" } },
  curious: { label: "Curious", gap: 20, left: { w: 34, h: 34, r: "50%" }, right: { w: 16, h: 16, r: "50%" } },
};

export type AvatarShape = keyof typeof AVATAR_SHAPES;
export type AvatarColor = keyof typeof AVATAR_COLORS;
export type AvatarEyeColor = keyof typeof AVATAR_EYE_COLORS;
export type AvatarEyes = "round" | "tall" | "calm" | "curious";
export type AvatarFill = "gradient" | "solid";

export type AvatarConfig = {
  shape: AvatarShape;
  color: AvatarColor;
  fill: AvatarFill;
  eyes: AvatarEyes;
  eyeColor: AvatarEyeColor;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  shape: "squircle",
  color: "slate",
  fill: "gradient",
  eyes: "tall",
  eyeColor: "white",
};

// waiting: blinks and glances. listening: looks down at the composer while the
// visitor types. writing: looks up and scans while a reply streams. happy: a
// squint and a hop when the brief arrives.
export type AvatarMood = "idle" | "listening" | "writing" | "happy";

const has = <T extends object>(table: T, key: unknown): key is keyof T =>
  typeof key === "string" && Object.prototype.hasOwnProperty.call(table, key);

/** Fills unknown or missing options from DEFAULT_AVATAR, so a bad value never breaks the chat. */
export function resolveAvatarConfig(input: Partial<Record<keyof AvatarConfig, unknown>> = {}): AvatarConfig {
  return {
    shape: has(AVATAR_SHAPES, input.shape) ? input.shape : DEFAULT_AVATAR.shape,
    color: has(AVATAR_COLORS, input.color) ? input.color : DEFAULT_AVATAR.color,
    fill: input.fill === "solid" || input.fill === "gradient" ? input.fill : DEFAULT_AVATAR.fill,
    eyes: has(AVATAR_EYES, input.eyes) ? (input.eyes as AvatarEyes) : DEFAULT_AVATAR.eyes,
    eyeColor: has(AVATAR_EYE_COLORS, input.eyeColor) ? input.eyeColor : DEFAULT_AVATAR.eyeColor,
  };
}

export type AvatarStyles = {
  frame: { width: number; height: number };
  body: { backgroundColor: string; borderRadius: string; clipPath: string; transform: string };
  shineOpacity: number;
  look: { gap: number; marginTop: number };
  leftEye: { width: number; height: number; borderRadius: string; backgroundColor: string };
  rightEye: { width: number; height: number; borderRadius: string; backgroundColor: string };
  eyeColor: string;
};

export function avatarStyles(config: AvatarConfig): AvatarStyles {
  const shape = AVATAR_SHAPES[config.shape];
  const eyes = AVATAR_EYES[config.eyes];
  const eyeColor = AVATAR_EYE_COLORS[config.eyeColor].value;
  const eye = (dot: EyeDot) => ({ width: dot.w, height: dot.h, borderRadius: dot.r, backgroundColor: eyeColor });

  return {
    frame: { width: shape.w, height: shape.h },
    body: {
      backgroundColor: AVATAR_COLORS[config.color].value,
      borderRadius: shape.radius,
      clipPath: shape.clip,
      transform: shape.rotate,
    },
    // The gradient is a light/shade overlay on a flat colour, so colour changes can fade.
    shineOpacity: config.fill === "gradient" ? 1 : 0,
    // Margin moves a flex-centred child by half its value.
    look: { gap: eyes.gap, marginTop: shape.eyeY * 2 },
    leftEye: eye(eyes.left),
    rightEye: eye(eyes.right),
    eyeColor,
  };
}
