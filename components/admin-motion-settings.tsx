"use client";

import { AgentAvatar, type AvatarConfig } from "@jamesalmeida/agent-avatars";
import { play } from "cuelume";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { SITE } from "@/data/site";
import { BouncingDots } from "./bouncing-dots";
import { usePacedText } from "./paced-text";
import {
  DEFAULT_MOTION,
  MOTION_LIMITS,
  type MotionSettings,
} from "@/lib/motion-settings";

// The chat's pace for every visitor: how slow the transitions run, how long
// Skaffen always thinks before a reply shows and how fast a reply's text appears.
// Saved by POST /api/admin/motion. "Preview" plays Skaffen popping in, thinking,
// then speaking while the reply appears, at the slider values, so the pace can be
// judged before saving.
export function AdminMotionSettings({ onLocked }: { onLocked: () => void }) {
  const [saved, setSaved] = useState<MotionSettings>(DEFAULT_MOTION);
  const [draft, setDraft] = useState<MotionSettings>(DEFAULT_MOTION);
  const [canSave, setCanSave] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scaleId = useId();
  const thinkingId = useId();
  const textSpeedId = useId();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/motion", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as {
          motion?: MotionSettings;
          canSave?: boolean;
        };
        if (cancelled || !payload.motion) return;
        setSaved(payload.motion);
        setDraft(payload.motion);
        setCanSave(payload.canSave === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (change: Partial<MotionSettings>) => {
    setDraft((current) => ({ ...current, ...change }));
    setStatus(null);
  };
  const isDirty =
    draft.durationScale !== saved.durationScale ||
    draft.minThinkingMs !== saved.minThinkingMs ||
    draft.textCharsPerSecond !== saved.textCharsPerSecond;

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion: draft }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (response.status === 401) {
        play("error");
        onLocked();
        return;
      }
      if (!response.ok) {
        play("error");
        setStatus(payload.error ?? "Unable to save.");
        return;
      }
      play("success");
      setSaved(draft);
      setStatus("Saved. Reload the site to try it.");
    } catch {
      play("error");
      setStatus("Request failed before it could be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={scaleId} className="text-sm font-medium">
              Animation pace
            </label>
            <span className="text-sm tabular-nums text-[var(--muted)]">
              {draft.durationScale.toFixed(1)}×{" "}
              {draft.durationScale === 1
                ? "(default)"
                : draft.durationScale > 1
                  ? "slower"
                  : "faster"}
            </span>
          </div>
          <input
            id={scaleId}
            type="range"
            min={MOTION_LIMITS.durationScale.min}
            max={MOTION_LIMITS.durationScale.max}
            step={MOTION_LIMITS.durationScale.step}
            value={draft.durationScale}
            onChange={(event) =>
              update({ durationScale: Number(event.target.value) })
            }
            className="w-full accent-[var(--accent)]"
          />
          <p className="text-xs leading-5 text-[var(--muted)]">
            Multiplies every chat transition: Skaffen leaving the header and
            popping in, messages sliding in, the composer gliding down, the tap
            tricks.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={thinkingId} className="text-sm font-medium">
              Minimum thinking time
            </label>
            <span className="text-sm tabular-nums text-[var(--muted)]">
              {(draft.minThinkingMs / 1000).toFixed(1)} s
            </span>
          </div>
          <input
            id={thinkingId}
            type="range"
            min={MOTION_LIMITS.minThinkingMs.min}
            max={MOTION_LIMITS.minThinkingMs.max}
            step={MOTION_LIMITS.minThinkingMs.step}
            value={draft.minThinkingMs}
            onChange={(event) =>
              update({ minThinkingMs: Number(event.target.value) })
            }
            className="w-full accent-[var(--accent)]"
          />
          <p className="text-xs leading-5 text-[var(--muted)]">
            Skaffen thinks for at least this long before a reply shows, even
            when the reply is ready sooner.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={textSpeedId} className="text-sm font-medium">
              Text speed
            </label>
            <span className="text-sm tabular-nums text-[var(--muted)]">
              {draft.textCharsPerSecond} characters a second
              {draft.textCharsPerSecond === DEFAULT_MOTION.textCharsPerSecond
                ? " (default)"
                : ""}
            </span>
          </div>
          <input
            id={textSpeedId}
            type="range"
            min={MOTION_LIMITS.textCharsPerSecond.min}
            max={MOTION_LIMITS.textCharsPerSecond.max}
            step={MOTION_LIMITS.textCharsPerSecond.step}
            value={draft.textCharsPerSecond}
            onChange={(event) =>
              update({ textCharsPerSecond: Number(event.target.value) })
            }
            className="w-full accent-[var(--accent)]"
          />
          <p className="text-xs leading-5 text-[var(--muted)]">
            How fast a new reply&apos;s text appears. It never shows faster
            than it arrives; Skaffen talks until it has all appeared.
          </p>
        </div>

        {!canSave ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">
            Saving is off on this deployment: it needs Convex (see CLAUDE.md).
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || !isDirty || isSaving}
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-50"
            data-cuelume-press="tick"
          >
            {isSaving ? "Saving..." : "Save for everyone"}
          </button>
          <button
            type="button"
            onClick={() => update(DEFAULT_MOTION)}
            disabled={
              draft.durationScale === DEFAULT_MOTION.durationScale &&
              draft.minThinkingMs === DEFAULT_MOTION.minThinkingMs &&
              draft.textCharsPerSecond === DEFAULT_MOTION.textCharsPerSecond
            }
            className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-medium transition hover:border-[var(--foreground)] disabled:opacity-50"
          >
            Reset to default
          </button>
          {status ? (
            <p role="status" className="text-sm text-[var(--muted)]">
              {status}
            </p>
          ) : null}
        </div>
      </div>
      <MotionPreview motion={draft} />
    </div>
  );
}

type PreviewStage = "idle" | "thinking" | "writing" | "done";

const PREVIEW_REPLY =
  "Happy to help. What does a normal week look like for you, and where has AI felt most confusing so far?";

// A small replay of a reply arriving at the slider values, with the same status
// line as the chat: Skaffen pops in and thinks for the minimum thinking time, then
// speaks while the reply appears below at the text speed, then shows its role.
function MotionPreview({ motion: settings }: { motion: MotionSettings }) {
  const [stage, setStage] = useState<PreviewStage>("idle");
  const [avatar, setAvatar] = useState<AvatarConfig>(SITE.assistant.avatar);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    fetch("/api/admin/avatar", { cache: "no-store" })
      .then((response) => response.json())
      .then(
        (payload: { avatar?: AvatarConfig }) =>
          payload.avatar && setAvatar(payload.avatar),
      )
      .catch(() => {});
    return () => window.clearTimeout(timer.current);
  }, []);

  const run = () => {
    window.clearTimeout(timer.current);
    setStage("idle");
    // Starts the pop on the next frame so a replay animates from scratch.
    timer.current = window.setTimeout(() => {
      setStage("thinking");
      timer.current = window.setTimeout(
        () => setStage("writing"),
        Math.max(settings.minThinkingMs, 300),
      );
    }, 50);
  };
  const s = (base: number) => base * settings.durationScale;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[200px] overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--background)] p-4">
        <AnimatePresence>
          {stage !== "idle" ? (
            <motion.div
              key="avatar"
              className="flex origin-left items-center gap-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: s(0.8), bounce: 0.3 }}
            >
              <AgentAvatar
                {...avatar}
                mood={stage === "thinking" ? "thinking" : "idle"}
                speaking={stage === "writing"}
                size={44}
                outline
              />
              <span className="text-[var(--muted)]">
                {stage === "thinking" ? "Thinking" : stage === "writing" ? "Writing" : SITE.assistant.role}
                {stage === "thinking" || stage === "writing" ? <BouncingDots duration={s(1.2)} /> : null}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {stage === "writing" || stage === "done" ? (
            <motion.div
              key="reply"
              className="mt-3 text-sm leading-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: s(0.5), ease: "easeOut" }}
            >
              <PreviewReply
                charsPerSecond={settings.textCharsPerSecond}
                onDone={() => setStage("done")}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={run}
        className="self-start rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium transition hover:border-[var(--foreground)]"
      >
        Preview
      </button>
    </div>
  );
}

function PreviewReply({ charsPerSecond, onDone }: { charsPerSecond: number; onDone: () => void }) {
  const { text, done } = usePacedText(PREVIEW_REPLY, charsPerSecond, { from: 0 });
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  return <p>{text}</p>;
}
