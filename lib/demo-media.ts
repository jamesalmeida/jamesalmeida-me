export type DemoMediaKind = "none" | "video" | "image";

const VIDEO_EXT = /\.(mp4|webm)$/i;
const IMAGE_EXT = /\.(gif|png|jpe?g|webp|avif|svg)$/i;

/** Classify a featured-demo src. null/empty → placeholder; never a broken embed. */
export function demoMediaKind(src: string | null | undefined): DemoMediaKind {
  if (typeof src !== "string") return "none";
  const path = src.trim().split("#")[0]?.split("?")[0] ?? "";
  if (!path) return "none";
  if (VIDEO_EXT.test(path)) return "video";
  if (IMAGE_EXT.test(path)) return "image";
  return "image";
}
