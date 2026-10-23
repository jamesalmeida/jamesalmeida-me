"use client";

import { play } from "cuelume";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_LANDING,
  LANDING_LIMITS,
  REVEAL_HEADLINE,
  parseLandingSetting,
  type LandingSettings,
} from "@/lib/landing-settings";

type HeadlineRow = { id: number; text: string; active: boolean };
type ExampleRow = { id: number; text: string };
type Draft = { headlines: HeadlineRow[]; examples: ExampleRow[]; exampleIntervalMs: number };

const fieldClass =
  "min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm outline-none transition focus:border-[var(--border-strong)]";
const iconButtonClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-40";
const addButtonClass =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3.5 py-2 text-sm font-medium transition hover:border-[var(--foreground)] disabled:opacity-50";

// The landing's words for every visitor: the headlines in the A/B test, the example
// prompts that rotate in the composer, and how long each shows. Saved by
// POST /api/admin/landing. Insights shows how each headline and example does.
export function AdminLandingSettings({ onLocked }: { onLocked: () => void }) {
  const nextId = useRef(0);
  const toDraft = (settings: LandingSettings): Draft => ({
    headlines: settings.headlines.map((headline) => ({ id: nextId.current++, ...headline })),
    examples: settings.examples.map((text) => ({ id: nextId.current++, text })),
    exampleIntervalMs: settings.exampleIntervalMs,
  });
  const [saved, setSaved] = useState<LandingSettings>(DEFAULT_LANDING);
  const [draft, setDraft] = useState<Draft>(() => toDraft(DEFAULT_LANDING));
  const [canSave, setCanSave] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const intervalId = useId();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/landing", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { landing?: LandingSettings; canSave?: boolean };
        if (cancelled || !payload.landing) return;
        setSaved(payload.landing);
        setDraft(toDraft(payload.landing));
        setCanSave(payload.canSave === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const value = {
    headlines: draft.headlines.map(({ text, active }) => ({ text, active })),
    examples: draft.examples.map(({ text }) => text),
    exampleIntervalMs: draft.exampleIntervalMs,
  };
  const parsed = parseLandingSetting(value);
  const isDirty = JSON.stringify(parsed ?? value) !== JSON.stringify(saved);
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_LANDING);
  const activeCount = draft.headlines.filter((headline) => headline.active).length;
  const problem = parsed
    ? null
    : activeCount === 0
      ? "Put at least one headline in the test."
      : "Fill in or remove empty rows, and remove duplicates.";

  const update = (change: (current: Draft) => Draft) => {
    setDraft(change);
    setStatus(null);
  };

  const handleSave = async () => {
    if (!parsed) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landing: parsed }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
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
      setSaved(parsed);
      setDraft(toDraft(parsed));
      setStatus("Saved. New visits get it.");
    } catch {
      play("error");
      setStatus("Request failed before it could be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Headlines</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Each visit is shown one of the headlines in the test, picked at random and kept until the tab
            closes. Insights compares how many visits of each start a chat. &ldquo;{REVEAL_HEADLINE}&rdquo;
            plays the &ldquo;I&rdquo; → &ldquo;AI&rdquo; animation; the others show as they are.
          </p>
        </div>
        <ul className="space-y-2">
          {draft.headlines.map((row) => (
            <li key={row.id} className="flex items-center gap-2">
              <label className="flex shrink-0 items-center gap-2 text-xs text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      headlines: current.headlines.map((item) =>
                        item.id === row.id ? { ...item, active: event.target.checked } : item,
                      ),
                    }))
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                In test
              </label>
              <input
                aria-label="Headline"
                value={row.text}
                maxLength={LANDING_LIMITS.headlines.chars}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    headlines: current.headlines.map((item) =>
                      item.id === row.id ? { ...item, text: event.target.value } : item,
                    ),
                  }))
                }
                className={fieldClass}
              />
              <button
                type="button"
                aria-label="Remove headline"
                title="Remove"
                disabled={draft.headlines.length <= LANDING_LIMITS.headlines.min}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    headlines: current.headlines.filter((item) => item.id !== row.id),
                  }))
                }
                className={iconButtonClass}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={draft.headlines.length >= LANDING_LIMITS.headlines.max}
          onClick={() =>
            update((current) => ({
              ...current,
              headlines: [...current.headlines, { id: nextId.current++, text: "", active: true }],
            }))
          }
          className={addButtonClass}
        >
          <Plus size={15} aria-hidden />
          Add headline
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Example prompts</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            They rotate in the landing composer, starting at a random one for each visit. Pressing send on an
            empty composer sends the one showing; Insights counts which get sent and how far those chats go.
          </p>
        </div>
        <ul className="space-y-2">
          {draft.examples.map((row) => (
            <li key={row.id} className="flex items-center gap-2">
              <input
                aria-label="Example prompt"
                value={row.text}
                maxLength={LANDING_LIMITS.examples.chars}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    examples: current.examples.map((item) =>
                      item.id === row.id ? { ...item, text: event.target.value } : item,
                    ),
                  }))
                }
                className={fieldClass}
              />
              <button
                type="button"
                aria-label="Remove example"
                title="Remove"
                disabled={draft.examples.length <= LANDING_LIMITS.examples.min}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    examples: current.examples.filter((item) => item.id !== row.id),
                  }))
                }
                className={iconButtonClass}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={draft.examples.length >= LANDING_LIMITS.examples.max}
          onClick={() =>
            update((current) => ({
              ...current,
              examples: [...current.examples, { id: nextId.current++, text: "" }],
            }))
          }
          className={addButtonClass}
        >
          <Plus size={15} aria-hidden />
          Add example
        </button>
      </div>

      <div className="max-w-md space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={intervalId} className="text-sm font-medium">
            Time per example
          </label>
          <span className="text-sm tabular-nums text-[var(--muted)]">
            {(draft.exampleIntervalMs / 1000).toFixed(1)} s
            {draft.exampleIntervalMs === DEFAULT_LANDING.exampleIntervalMs ? " (default)" : ""}
          </span>
        </div>
        <input
          id={intervalId}
          type="range"
          min={LANDING_LIMITS.exampleIntervalMs.min}
          max={LANDING_LIMITS.exampleIntervalMs.max}
          step={LANDING_LIMITS.exampleIntervalMs.step}
          value={draft.exampleIntervalMs}
          onChange={(event) => update((current) => ({ ...current, exampleIntervalMs: Number(event.target.value) }))}
          className="w-full accent-[var(--accent)]"
        />
        <p className="text-xs leading-5 text-[var(--muted)]">
          How long each example shows before the next slides in. They stop once the visitor clicks into the
          composer.
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
          disabled={!canSave || !parsed || !isDirty || isSaving}
          className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-50"
          data-cuelume-press="tick"
        >
          {isSaving ? "Saving..." : "Save for everyone"}
        </button>
        <button
          type="button"
          onClick={() => update(() => toDraft(DEFAULT_LANDING))}
          disabled={isDefault}
          className="rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-medium transition hover:border-[var(--foreground)] disabled:opacity-50"
        >
          Reset to default
        </button>
        {problem ? (
          <p role="status" className="text-sm text-[var(--muted)]">
            {problem}
          </p>
        ) : status ? (
          <p role="status" className="text-sm text-[var(--muted)]">
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
}
