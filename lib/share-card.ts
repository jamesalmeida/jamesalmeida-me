// The share card (link preview) drawn on a canvas, frame by frame, for the /admin
// studio: its live preview, the PNG download and the recorded video all come from
// drawShareCard(), so they match. The layout follows app/opengraph-image.tsx.
// Browser-only (canvas); the avatar geometry comes from agent-avatars.

import { EYES, SHAPES, colorValue, eyeColorValue, type AvatarConfig } from "@jamesalmeida/agent-avatars";
import { HEADLINES, PROMPT_EXAMPLES, SITE } from "@/data/site";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

export type ShareCard = {
  /** Small serif line at the top. */
  label: string;
  headline: string;
  /** A word in the headline drawn in the accent colour (e.g. "AI"). Empty for none. */
  highlight: string;
  subline: string;
  /** The composer's example. Empty hides the composer. */
  prompt: string;
  avatar: AvatarConfig;
  /** Video: the highlighted word's first letter drops in, like the landing's "I" → "AI". */
  reveal: boolean;
  videoSeconds: number;
};

export const VIDEO_SECONDS = { min: 4, max: 12, step: 1 } as const;

export const DEFAULT_SHARE_CARD: ShareCard = {
  label: "JamesAlmeida.me",
  headline: HEADLINES[0],
  highlight: "AI",
  subline: "AI for individuals and small teams, at your own pace.",
  prompt: PROMPT_EXAMPLES[0],
  avatar: { ...SITE.assistant.avatar, shape: "blob" },
  reveal: true,
  videoSeconds: 7,
};

/** The moment used for the PNG: the headline revealed, Skaffen looking at it. */
export const STILL_SECONDS = 2;

export type ShareCardFonts = { serif: string; sans: string };

const BACKGROUND = "#f7f5ef";
const INK = "#111111";
const MUTED = "rgba(17, 17, 17, 0.6)";
const ACCENT = "#2f4858";
const PAD_X = 72;
const PAD_Y = 64;
const TEXT_WIDTH = 780;
const HEADLINE_SIZE = 104;
const HEADLINE_LINE = 1.02;
const SUBLINE_SIZE = 30;
const SUBLINE_LINE = 1.4;
const COMPOSER = { width: 760, height: 84 };
/** Skaffen's body: a 150-unit-wide avatar (the squircle) is drawn this many px wide. */
const AVATAR_SCALE = 200 / 150;

// Timeline (seconds). The "A" waits a beat, then opens a gap and drops in, as on the
// landing; Skaffen watches it, glances up, looks at the composer, then back.
const REVEAL_AT = 1.1;
const LOOKS: [number, number, number][] = [
  // [time, x, y] in agent-avatars' stage px (LOOK_RANGE is 14 × 10)
  [0, 0, 0],
  [0.7, -13, -3],
  [2.3, -13, -3],
  [2.8, 7, -7],
  [3.7, 7, -7],
  [4.2, -6, 6],
  [5.1, -6, 6],
  [5.6, 0, 0],
];
const BLINKS = [2.55, 4.6, 6.6, 8.6, 10.6];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
// A little overshoot, for the drop.
const easeOutBack = (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;

function lookAt(t: number): { x: number; y: number } {
  for (let i = 1; i < LOOKS.length; i++) {
    const [t0, x0, y0] = LOOKS[i - 1];
    const [t1, x1, y1] = LOOKS[i];
    if (t <= t1) {
      const p = easeInOut(clamp01((t - t0) / (t1 - t0)));
      return { x: x0 + (x1 - x0) * p, y: y0 + (y1 - y0) * p };
    }
  }
  return { x: 0, y: 0 };
}

function blinkAt(t: number): number {
  for (const at of BLINKS) {
    const d = Math.abs(t - at);
    if (d < 0.08) return 0.1 + 0.9 * (d / 0.08);
  }
  return 1;
}

// CSS border-radius ("58% 42% 55% 45% / 50% 58% 42% 50%", "38%", "999px") as
// [rx, ry] for the top-left, top-right, bottom-right and bottom-left corners,
// scaled down like CSS when corners would overlap.
function cornerRadii(radius: string, w: number, h: number): [number, number][] {
  const [horizontal, vertical] = radius.split("/").map((part) => part.trim().split(/\s+/));
  const four = (values: string[]) =>
    values.length === 1
      ? [values[0], values[0], values[0], values[0]]
      : values.length === 2
        ? [values[0], values[1], values[0], values[1]]
        : values.length === 3
          ? [values[0], values[1], values[2], values[1]]
          : values.slice(0, 4);
  const xs = four(horizontal);
  const ys = four(vertical ?? horizontal);
  const length = (value: string, base: number) =>
    value.endsWith("%") ? (parseFloat(value) / 100) * base : parseFloat(value) || 0;
  const radii = xs.map((x, i) => [length(x, w), length(ys[i], h)] as [number, number]);
  const [tl, tr, br, bl] = radii;
  const fit = Math.min(
    1,
    w / (tl[0] + tr[0] || 1),
    w / (bl[0] + br[0] || 1),
    h / (tl[1] + bl[1] || 1),
    h / (tr[1] + br[1] || 1),
  );
  return radii.map(([x, y]) => [x * fit, y * fit]);
}

function polygonPoints(clip: string, w: number, h: number): [number, number][] | null {
  const match = /^polygon\((.*)\)$/.exec(clip.trim());
  if (!match) return null;
  const points = match[1].split(",").map((pair) => {
    const [x, y] = pair.trim().split(/\s+/).map((value) => parseFloat(value) / 100);
    return [x * w, y * h] as [number, number];
  });
  // A full-rectangle clip (every shape but the hexagon) clips nothing.
  const isFull = points.every(([x, y]) => (x === 0 || x === w || x === w / 2) && (y === 0 || y === h || y === h / 2));
  return isFull ? null : points;
}

function bodyPath(ctx: CanvasRenderingContext2D, avatar: AvatarConfig, w: number, h: number) {
  const shape = SHAPES[avatar.shape];
  ctx.beginPath();
  const polygon = polygonPoints(shape.clip, w, h);
  if (polygon) {
    polygon.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    return;
  }
  const [tl, tr, br, bl] = cornerRadii(shape.radius, w, h);
  ctx.moveTo(tl[0], 0);
  ctx.lineTo(w - tr[0], 0);
  ctx.ellipse(w - tr[0], tr[1], tr[0], tr[1], 0, -Math.PI / 2, 0);
  ctx.lineTo(w, h - br[1]);
  ctx.ellipse(w - br[0], h - br[1], br[0], br[1], 0, 0, Math.PI / 2);
  ctx.lineTo(bl[0], h);
  ctx.ellipse(bl[0], h - bl[1], bl[0], bl[1], 0, Math.PI / 2, Math.PI);
  ctx.lineTo(0, tl[1]);
  ctx.ellipse(tl[0], tl[1], tl[0], tl[1], 0, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Skaffen with its centre at (cx, cy): body, shine, then the eyes looking at `look`. */
function drawAvatar(ctx: CanvasRenderingContext2D, avatar: AvatarConfig, cx: number, cy: number, t: number) {
  const shape = SHAPES[avatar.shape];
  const k = AVATAR_SCALE;
  const w = shape.w * k;
  const h = shape.h * k;

  ctx.save();
  ctx.translate(cx, cy);
  const rotation = /rotate\((-?[\d.]+)deg\)/.exec(shape.rotate);
  ctx.save();
  if (rotation) ctx.rotate((parseFloat(rotation[1]) * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  bodyPath(ctx, avatar, w, h);
  ctx.shadowColor = "rgba(17, 17, 17, 0.18)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = colorValue(avatar.color);
  ctx.fill();
  ctx.shadowColor = "transparent";
  if (avatar.fill === "gradient") {
    // agent-avatars' shine: radial-gradient(120% 120% at 28% 22%, …)
    ctx.save();
    ctx.clip();
    ctx.translate(w * 0.28, h * 0.22);
    ctx.scale(1, h / w);
    const shine = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.2);
    shine.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    shine.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    shine.addColorStop(1, "rgba(0, 0, 0, 0.34)");
    ctx.fillStyle = shine;
    ctx.fillRect(-w * 2, -w * 2, w * 4, w * 4);
    ctx.restore();
  }
  ctx.restore();

  // Eyes: centred, nudged down by the shape's eyeY, looking around.
  const eyes = EYES[avatar.eyes];
  const look = lookAt(t);
  const blink = blinkAt(t);
  const eyeY = (shape.eyeY + look.y) * k;
  const total = (eyes.left.w + eyes.gap + eyes.right.w) * k;
  let x = -total / 2 + look.x * k;
  ctx.fillStyle = eyeColorValue(avatar.eyeColor);
  for (const dot of [eyes.left, eyes.right]) {
    const dw = dot.w * k;
    const dh = dot.h * k * blink;
    const radius = dot.r.endsWith("%") ? Math.min(dw, dh) / 2 : Math.min(parseFloat(dot.r) * k, dw / 2, dh / 2);
    roundedRect(ctx, x, eyeY - dh / 2, dw, dh, radius);
    ctx.fill();
    x += dw + eyes.gap * k;
  }
  ctx.restore();
}

type Word = { text: string; highlight: boolean; reveal: boolean };

function wrap(ctx: CanvasRenderingContext2D, words: Word[], space: number, maxWidth: number): Word[][] {
  const lines: Word[][] = [];
  let line: Word[] = [];
  let width = 0;
  for (const word of words) {
    const w = ctx.measureText(word.text).width;
    if (line.length > 0 && width + space + w > maxWidth) {
      lines.push(line);
      line = [];
      width = 0;
    }
    width += (line.length > 0 ? space : 0) + w;
    line.push(word);
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  return wrap(
    ctx,
    text.split(/\s+/).filter(Boolean).map((word) => ({ text: word, highlight: false, reveal: false })),
    ctx.measureText(" ").width,
    maxWidth,
  ).map((line) => line.map((word) => word.text).join(" "));
}

/**
 * Draws the card at `t` seconds into its animation. `t` past the end (or `animate`
 * off) shows the final frame: the headline revealed, Skaffen looking ahead.
 */
export function drawShareCard(ctx: CanvasRenderingContext2D, card: ShareCard, fonts: ShareCardFonts, t: number) {
  const { width, height } = SHARE_CARD_SIZE;
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Background with a soft slate glow behind Skaffen.
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.85, height * 0.2, 0, width * 0.85, height * 0.2, 1140);
  glow.addColorStop(0, "rgba(47, 72, 88, 0.10)");
  glow.addColorStop(0.45, "rgba(47, 72, 88, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Top label.
  ctx.font = `400 38px ${fonts.serif}`;
  ctx.fillStyle = INK;
  const labelMetrics = ctx.measureText("Hg");
  ctx.fillText(card.label, PAD_X, PAD_Y + labelMetrics.fontBoundingBoxAscent);
  const labelBottom = PAD_Y + labelMetrics.fontBoundingBoxAscent + labelMetrics.fontBoundingBoxDescent;

  // Headline: wrapped as it ends up (revealed), so lines don't jump while the A drops in.
  ctx.font = `400 ${HEADLINE_SIZE}px ${fonts.serif}`;
  const highlight = card.highlight.trim();
  let revealUsed = false;
  const words: Word[] = card.headline
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => {
      const isHighlight = highlight !== "" && text.replace(/[^\p{L}\p{N}]/gu, "") === highlight;
      const reveal = isHighlight && card.reveal && !revealUsed && text.length > 1;
      if (reveal) revealUsed = true;
      return { text, highlight: isHighlight, reveal };
    });
  const space = ctx.measureText(" ").width;
  const headlineLines = wrap(ctx, words, space, TEXT_WIDTH);
  const headlineMetrics = ctx.measureText("Hg");
  const lineHeight = HEADLINE_SIZE * HEADLINE_LINE;
  const ascent = headlineMetrics.fontBoundingBoxAscent;
  const glyphHeight = ascent + headlineMetrics.fontBoundingBoxDescent;

  ctx.font = `400 ${SUBLINE_SIZE}px ${fonts.sans}`;
  const sublineLines = card.subline.trim() ? wrapText(ctx, card.subline, TEXT_WIDTH) : [];
  const sublineHeight = SUBLINE_SIZE * SUBLINE_LINE;

  const composerTop = height - PAD_Y - COMPOSER.height;
  const hasComposer = card.prompt.trim() !== "";
  const middleHeight =
    headlineLines.length * lineHeight + (sublineLines.length ? 22 + sublineLines.length * sublineHeight : 0);
  const areaTop = labelBottom;
  const areaBottom = hasComposer ? composerTop : height - PAD_Y;
  const middleTop = (areaTop + areaBottom) / 2 - middleHeight / 2;

  // The revealed letter: its width opens, then it fades and drops in.
  const since = t - REVEAL_AT;
  const open = easeOutCubic(clamp01(since / 0.55));
  const fade = clamp01((since - 0.15) / 0.4);
  const drop = easeOutBack(clamp01((since - 0.15) / 0.5));

  ctx.font = `400 ${HEADLINE_SIZE}px ${fonts.serif}`;
  headlineLines.forEach((line, row) => {
    const baseline = middleTop + row * lineHeight + (lineHeight - glyphHeight) / 2 + ascent;
    let x = PAD_X;
    line.forEach((word, index) => {
      if (index > 0) x += space;
      ctx.fillStyle = word.highlight ? ACCENT : INK;
      if (!word.reveal) {
        ctx.fillText(word.text, x, baseline);
        x += ctx.measureText(word.text).width;
        return;
      }
      const first = word.text[0];
      const rest = word.text.slice(1);
      const firstWidth = ctx.measureText(first).width * open;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, baseline - ascent * 1.4, firstWidth, glyphHeight * 1.6);
      ctx.clip();
      ctx.globalAlpha = fade;
      ctx.fillText(first, x, baseline - HEADLINE_SIZE * 0.35 * (1 - drop));
      ctx.restore();
      x += firstWidth;
      ctx.fillText(rest, x, baseline);
      x += ctx.measureText(rest).width;
    });
  });

  // Subline.
  ctx.font = `400 ${SUBLINE_SIZE}px ${fonts.sans}`;
  ctx.fillStyle = MUTED;
  const sublineTop = middleTop + headlineLines.length * lineHeight + 22;
  sublineLines.forEach((line, row) => {
    ctx.fillText(line, PAD_X, sublineTop + row * sublineHeight + SUBLINE_SIZE * 1.05);
  });

  // Skaffen, centred on the headline block, on the right.
  const avatarWidth = SHAPES[card.avatar.shape].w * AVATAR_SCALE;
  drawAvatar(ctx, card.avatar, width - PAD_X - Math.max(avatarWidth, 200) / 2, middleTop + middleHeight / 2, t);

  // Composer.
  if (hasComposer) {
    ctx.save();
    roundedRect(ctx, PAD_X, composerTop, COMPOSER.width, COMPOSER.height, COMPOSER.height / 2);
    ctx.shadowColor = "rgba(0, 0, 0, 0.07)";
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(17, 17, 17, 0.14)";
    ctx.stroke();
    ctx.restore();

    ctx.font = `400 28px ${fonts.sans}`;
    ctx.fillStyle = MUTED;
    let prompt = `Try “${card.prompt.trim()}”`;
    const maxPrompt = COMPOSER.width - 34 - 84;
    while (ctx.measureText(prompt).width > maxPrompt && prompt.length > 8) prompt = `${prompt.slice(0, -3)}…”`;
    ctx.fillText(prompt, PAD_X + 34, composerTop + COMPOSER.height / 2 + 10);

    const buttonX = PAD_X + COMPOSER.width - 12 - 30;
    const buttonY = composerTop + COMPOSER.height / 2;
    ctx.beginPath();
    ctx.arc(buttonX, buttonY, 30, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(buttonX, buttonY + 8);
    ctx.lineTo(buttonX, buttonY - 8);
    ctx.moveTo(buttonX - 8, buttonY);
    ctx.lineTo(buttonX, buttonY - 8);
    ctx.lineTo(buttonX + 8, buttonY);
    ctx.stroke();
  }

  ctx.restore();
}

/** The video's container: MP4 where the browser can record it (Chrome, Safari), else WebM. */
export function pickVideoType(): { mimeType: string; extension: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates: [string, "mp4" | "webm"][] = [
    ["video/mp4;codecs=avc1.42E01F", "mp4"],
    ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9", "webm"],
    ["video/webm", "webm"],
  ];
  for (const [mimeType, extension] of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType, extension };
  }
  return null;
}
