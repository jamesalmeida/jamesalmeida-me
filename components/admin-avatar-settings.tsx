"use client";

import {
  AgentAvatar,
  COLORS,
  EYES,
  EYE_COLORS,
  SHAPES,
  colorValue,
  eyeColorValue,
  type AvatarConfig,
  type AvatarMood,
} from "@jamesalmeida/agent-avatars";
import { play } from "cuelume";
import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SITE_AVATAR } from "@/lib/avatar-settings";

const MOODS: AvatarMood[] = ["idle", "listening", "thinking", "writing", "happy"];
const FILLS = ["gradient", "solid"] as const;

const pillClass = (selected: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
    selected
      ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)]"
  }`;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="space-y-2.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

// A preset swatch row plus a native colour picker for any hex colour.
function ColorField({
  label,
  presets,
  value,
  resolve,
  onChange,
}: {
  label: string;
  presets: Record<string, { label: string; value: string }>;
  value: string;
  resolve: (value: string) => string;
  onChange: (value: string) => void;
}) {
  const isCustom = !(value in presets);
  return (
    <Field label={label}>
      {Object.entries(presets).map(([key, preset]) => (
        <button
          key={key}
          type="button"
          title={preset.label}
          aria-label={preset.label}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`h-9 w-9 rounded-full border border-[var(--border-strong)] transition ${
            value === key ? "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]" : ""
          }`}
          style={{ backgroundColor: preset.value }}
          data-cuelume-press="tick"
        />
      ))}
      <label
        title="Custom colour"
        className={`relative flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-1 pr-3 text-sm ${
          isCustom ? "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]" : ""
        }`}
      >
        <span
          className="h-7 w-7 rounded-full border border-[var(--border-strong)]"
          style={{ backgroundColor: resolve(value) }}
        />
        {isCustom ? value : "Custom"}
        <input
          type="color"
          aria-label={`Custom ${label.toLowerCase()}`}
          className="absolute inset-0 cursor-pointer opacity-0"
          value={resolve(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </Field>
  );
}

// Skaffen's look for every visitor. Saved by POST /api/admin/avatar (Convex).
export function AdminAvatarSettings({ onLocked }: { onLocked: () => void }) {
  const [saved, setSaved] = useState<AvatarConfig>(DEFAULT_SITE_AVATAR);
  const [draft, setDraft] = useState<AvatarConfig>(DEFAULT_SITE_AVATAR);
  const [canSave, setCanSave] = useState(true);
  const [mood, setMood] = useState<AvatarMood>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/avatar")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { avatar?: AvatarConfig; canSave?: boolean };
        if (cancelled || !payload.avatar) return;
        setSaved(payload.avatar);
        setDraft(payload.avatar);
        setCanSave(payload.canSave === true);
      })
      .catch(() => {
        // Keeps the site default.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (change: Partial<AvatarConfig>) => {
    setDraft((current) => ({ ...current, ...change }));
    setStatus(null);
  };
  const isDirty = (Object.keys(draft) as (keyof AvatarConfig)[]).some((key) => draft[key] !== saved[key]);
  const isDefault = (Object.keys(draft) as (keyof AvatarConfig)[]).every(
    (key) => draft[key] === DEFAULT_SITE_AVATAR[key],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: draft }),
      });
      const payload = (await response.json()) as { error?: string };
      if (response.status === 401) {
        play("error");
        onLocked();
        return;
      }
      if (!response.ok) {
        play("error");
        setStatus(payload.error ?? "Unable to save the avatar.");
        return;
      }
      play("success");
      setSaved(draft);
      setStatus("Saved. Visitors see the new avatar on their next visit.");
    } catch {
      play("error");
      setStatus("Request failed before the avatar could be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-[200px] w-[200px] items-center justify-center rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]">
          <AgentAvatar {...draft} mood={mood} size={140} followPointer label="Avatar preview" />
        </div>
        <div role="group" aria-label="Preview mood" className="flex flex-wrap justify-center gap-1.5">
          {MOODS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mood === option}
              onClick={() => setMood(option)}
              className={`${pillClass(mood === option)} px-3 py-1.5 text-xs`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Field label="Shape">
          {(Object.keys(SHAPES) as (keyof typeof SHAPES)[]).map((shape) => (
            <button
              key={shape}
              type="button"
              aria-pressed={draft.shape === shape}
              onClick={() => update({ shape })}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-3 pb-2 pt-3 text-xs font-medium transition ${
                draft.shape === shape
                  ? "border-[var(--foreground)] bg-[var(--surface)]"
                  : "border-[var(--border)] hover:border-[var(--border-strong)]"
              }`}
              data-cuelume-press="tick"
            >
              <AgentAvatar {...draft} shape={shape} animated={false} size={36} />
              {SHAPES[shape].label}
            </button>
          ))}
        </Field>

        <ColorField
          label="Colour"
          presets={COLORS}
          value={draft.color}
          resolve={colorValue}
          onChange={(color) => update({ color })}
        />

        <Field label="Fill">
          {FILLS.map((fill) => (
            <button
              key={fill}
              type="button"
              aria-pressed={draft.fill === fill}
              onClick={() => update({ fill })}
              className={pillClass(draft.fill === fill)}
              data-cuelume-press="tick"
            >
              {fill}
            </button>
          ))}
        </Field>

        <Field label="Eyes">
          {(Object.keys(EYES) as (keyof typeof EYES)[]).map((eyes) => (
            <button
              key={eyes}
              type="button"
              aria-pressed={draft.eyes === eyes}
              onClick={() => update({ eyes })}
              className={pillClass(draft.eyes === eyes)}
              data-cuelume-press="tick"
            >
              {eyes}
            </button>
          ))}
        </Field>

        <ColorField
          label="Eye colour"
          presets={EYE_COLORS}
          value={draft.eyeColor}
          resolve={eyeColorValue}
          onChange={(eyeColor) => update({ eyeColor })}
        />

        {!canSave ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">
            Saving is off on this deployment. It needs a Convex URL and <code>CONVEX_SERVER_SECRET</code>{" "}
            (see CLAUDE.md), then a redeploy.
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
            onClick={() => update(DEFAULT_SITE_AVATAR)}
            disabled={isDefault}
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
    </div>
  );
}
