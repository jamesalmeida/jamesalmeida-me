"use client";

import { AvatarEditor, type AvatarConfig } from "@jamesalmeida/agent-avatars";
import { play } from "cuelume";
import localFont from "next/font/local";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { parseAvatarSetting } from "@/lib/avatar-settings";
import {
  DEFAULT_SHARE_CARD,
  SHARE_CARD_SIZE,
  STILL_SECONDS,
  VIDEO_SECONDS,
  drawShareCard,
  pickVideoType,
  type ShareCard,
  type ShareCardFonts,
} from "@/lib/share-card";

// Static Latin cuts of Source Serif 4 and Inter (SIL OFL) in assets/og.
const serifFont = localFont({ src: "../assets/og/SourceSerif4-Display.ttf", display: "block" });
const sansFont = localFont({ src: "../assets/og/Inter-Regular.ttf", display: "block" });
const FONTS: ShareCardFonts = { serif: serifFont.style.fontFamily, sans: sansFont.style.fontFamily };

// Drafts stay in this browser until downloaded; nothing is saved to the site.
const DRAFT_KEY = "jamesalmeida-share-card";
/** The preview holds the last frame this long before looping. */
const LOOP_PAUSE = 1.2;

const editorTheme = {
  "--aa-editor-accent": "var(--foreground)",
  "--aa-editor-muted": "var(--muted)",
  "--aa-editor-border": "var(--border-strong)",
  "--aa-editor-control": "var(--surface-muted)",
  "--aa-editor-selected": "var(--surface)",
  "--aa-editor-ring": "var(--panel-strong)",
} as CSSProperties;

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm outline-none transition focus:border-[var(--border-strong)]";
const buttonClass =
  "rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-medium transition hover:border-[var(--foreground)] disabled:opacity-50";

function readDraft(): ShareCard | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = { ...DEFAULT_SHARE_CARD, ...(JSON.parse(raw) as Partial<ShareCard>) };
    const avatar = parseAvatarSetting(draft.avatar);
    return avatar ? { ...draft, avatar } : { ...draft, avatar: DEFAULT_SHARE_CARD.avatar };
  } catch {
    return null;
  }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Loads the two faces before drawing. Only the first family in each stack: next/font
// adds a local() fallback face that can fail to load, which would reject the lot.
async function fontsReady() {
  const first = (stack: string) => stack.split(",")[0].trim();
  try {
    await Promise.all([
      document.fonts.load(`400 104px ${first(FONTS.serif)}`, "What can AI do"),
      document.fonts.load(`400 30px ${first(FONTS.sans)}`, "Try"),
    ]);
  } catch {
    // Draw with whatever loaded rather than not at all.
  }
}

function newCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_SIZE.width;
  canvas.height = SHARE_CARD_SIZE.height;
  return { canvas, ctx: canvas.getContext("2d")! };
}

// /admin → Share card: edit the link preview's words and Skaffen, watch it animate
// (the "I" → "AI" drop-in, Skaffen looking around), and download a PNG or a video.
export function AdminShareCard() {
  const [card, setCard] = useState<ShareCard>(DEFAULT_SHARE_CARD);
  const [isPlaying, setIsPlaying] = useState(true);
  const [recording, setRecording] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef(card);
  // True once this browser's draft (if any) is in state; saving waits for it, so the
  // defaults never overwrite a draft before it's read.
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);
  const ids = { label: useId(), headline: useId(), highlight: useId(), subline: useId(), prompt: useId(), seconds: useId() };
  const [video, setVideo] = useState<ReturnType<typeof pickVideoType>>(null);

  // Start from this browser's draft, else the defaults with the site's saved avatar.
  useEffect(() => {
    const draft = readDraft();
    if (draft) setCard(draft);
    else {
      fetch("/api/admin/avatar", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload: { avatar?: AvatarConfig }) => {
          if (payload.avatar) setCard((current) => ({ ...current, avatar: { ...payload.avatar!, shape: "blob" } }));
        })
        .catch(() => {});
    }
    setHasDraftLoaded(true);
    setVideo(pickVideoType());
    void fontsReady().then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    cardRef.current = card;
    if (!hasDraftLoaded) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(card));
    } catch {
      // A draft that isn't kept is fine.
    }
  }, [card, hasDraftLoaded]);

  // The preview: loops the animation, or holds the PNG's frame while paused.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !fontsLoaded) return;
    if (!isPlaying) {
      drawShareCard(ctx, card, FONTS, STILL_SECONDS);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const current = cardRef.current;
      const loop = current.videoSeconds + LOOP_PAUSE;
      drawShareCard(ctx, current, FONTS, Math.min(((now - start) / 1000) % loop, current.videoSeconds));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, fontsLoaded, card]);

  const update = (change: Partial<ShareCard>) => setCard((current) => ({ ...current, ...change }));

  const downloadImage = async () => {
    await fontsReady();
    const { canvas, ctx } = newCanvas();
    drawShareCard(ctx, card, FONTS, STILL_SECONDS);
    canvas.toBlob((blob) => {
      if (!blob) return;
      play("success");
      download(blob, "jamesalmeida-share.png");
    }, "image/png");
  };

  // Records the animation in real time from a canvas stream. MP4 where the browser
  // can (Chrome, Safari), WebM otherwise.
  const downloadVideo = async () => {
    if (!video || recording !== null) return;
    await fontsReady();
    const { canvas, ctx } = newCanvas();
    const snapshot = card;
    drawShareCard(ctx, snapshot, FONTS, 0);
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: video.mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(null);
      play("success");
      download(new Blob(chunks, { type: video.mimeType.split(";")[0] }), `jamesalmeida-share.${video.extension}`);
      setStatus(`Downloaded a ${snapshot.videoSeconds} s ${video.extension.toUpperCase()}.`);
    };
    setStatus(null);
    setRecording(0);
    recorder.start(250);
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      drawShareCard(ctx, snapshot, FONTS, Math.min(t, snapshot.videoSeconds));
      setRecording(Math.min(t / snapshot.videoSeconds, 1));
      if (t < snapshot.videoSeconds) requestAnimationFrame(tick);
      else recorder.stop();
    };
    requestAnimationFrame(tick);
  };

  const textField = (id: string, label: string, key: "label" | "headline" | "highlight" | "subline" | "prompt", hint?: string) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} value={card[key]} onChange={(event) => update({ [key]: event.target.value })} className={fieldClass} />
      {hint ? <p className="text-xs leading-5 text-[var(--muted)]">{hint}</p> : null}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <canvas
          ref={canvasRef}
          width={SHARE_CARD_SIZE.width}
          height={SHARE_CARD_SIZE.height}
          aria-label="Share card preview"
          role="img"
          className="block h-auto w-full rounded-2xl border border-[var(--border)]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setIsPlaying(!isPlaying)} className={buttonClass}>
            {isPlaying ? "Pause on the image frame" : "Play the animation"}
          </button>
          <button
            type="button"
            onClick={() => void downloadImage()}
            disabled={!fontsLoaded}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-50"
            data-cuelume-press="tick"
          >
            Download image (PNG)
          </button>
          <button
            type="button"
            onClick={() => void downloadVideo()}
            disabled={!fontsLoaded || !video || recording !== null}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-50"
            data-cuelume-press="tick"
          >
            {recording !== null
              ? `Recording… ${Math.round(recording * 100)}%`
              : `Download video (${video?.extension.toUpperCase() ?? "not supported"})`}
          </button>
          {status ? (
            <p role="status" className="text-sm text-[var(--muted)]">
              {status}
            </p>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-[var(--muted)]">
          1200 × 630. The image is the paused frame. The video records the animation in real time, so it takes as long
          as it plays{video?.extension === "webm" ? "; this browser can only record WebM (Chrome or Safari record MP4)" : ""}.
          Edits stay in this browser as a draft.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {textField(ids.label, "Top line", "label")}
          {textField(ids.headline, "Headline", "headline")}
          {textField(ids.highlight, "Highlighted word", "highlight", "Drawn in the accent colour. Leave empty for none.")}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={card.reveal}
              onChange={(event) => update({ reveal: event.target.checked })}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Video: its first letter drops in (&ldquo;I&rdquo; → &ldquo;AI&rdquo;)
          </label>
          {textField(ids.subline, "Line under the headline", "subline")}
          {textField(ids.prompt, "Composer example", "prompt", "Shown as Try “…”. Leave empty to hide the composer.")}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={ids.seconds} className="text-sm font-medium">
                Video length
              </label>
              <span className="text-sm tabular-nums text-[var(--muted)]">{card.videoSeconds} s</span>
            </div>
            <input
              id={ids.seconds}
              type="range"
              min={VIDEO_SECONDS.min}
              max={VIDEO_SECONDS.max}
              step={VIDEO_SECONDS.step}
              value={card.videoSeconds}
              onChange={(event) => update({ videoSeconds: Number(event.target.value) })}
              className="w-full accent-[var(--accent)]"
            />
          </div>
          <button type="button" onClick={() => setCard(DEFAULT_SHARE_CARD)} className={buttonClass}>
            Reset to default
          </button>
        </div>
        <AvatarEditor
          value={card.avatar}
          onChange={(avatar) => update({ avatar })}
          preview={false}
          style={editorTheme}
        />
      </div>
    </div>
  );
}
