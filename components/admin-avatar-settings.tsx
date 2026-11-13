"use client";

import { AvatarEditor, type AvatarConfig } from "@jamesalmeida/agent-avatars";
import { useCallback, type CSSProperties } from "react";
import { DEFAULT_SITE_AVATAR } from "@/lib/avatar-settings";
import { formNotice, useSettingsForm, type SettingsLoad, type SettingsSave } from "./use-settings-form";

// The package's editor, themed with the site's colours.
const editorTheme = {
  "--aa-editor-accent": "var(--foreground)",
  "--aa-editor-muted": "var(--muted)",
  "--aa-editor-border": "var(--border-strong)",
  "--aa-editor-control": "var(--surface-muted)",
  "--aa-editor-selected": "var(--surface)",
  "--aa-editor-ring": "var(--panel-strong)",
} as CSSProperties;

// Skaffen's look for every visitor. Saved by POST /api/admin/avatar (Convex).
export function AdminAvatarSettings({ onLocked }: { onLocked: () => void }) {
  const load = useCallback(async (): Promise<SettingsLoad<AvatarConfig>> => {
    try {
      const response = await fetch("/api/admin/avatar", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        avatar?: AvatarConfig;
        canSave?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.avatar) {
        return { error: payload.error ?? "Could not load the saved avatar." };
      }
      return { draft: payload.avatar, canSave: payload.canSave === true };
    } catch {
      return { error: "Could not load the saved avatar." };
    }
  }, []);

  const save = useCallback(async (draft: AvatarConfig): Promise<SettingsSave<AvatarConfig>> => {
    try {
      const response = await fetch("/api/admin/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: draft }),
      });
      if (response.status === 401) return { locked: true };
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) return { error: payload.error ?? "Unable to save the avatar." };
      return { ok: true };
    } catch {
      return { error: "Request failed before the avatar could be saved." };
    }
  }, []);

  const { state, canSave, edit, submit, retry } = useSettingsForm<AvatarConfig>({
    load,
    save,
    onLocked,
    savedNotice: "Saved. Visitors see the new avatar on their next visit.",
  });

  if (state.status === "loading") {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }
  if (state.status === "load_failed") {
    return (
      <p role="alert" className="text-sm leading-6 text-[var(--muted)]">
        {state.message}{" "}
        <button type="button" onClick={() => void retry()} className="underline underline-offset-4">
          Retry
        </button>
      </p>
    );
  }

  const draft = state.draft;
  const isSaving = state.status === "saving";
  const notice = formNotice(state);
  const isDirty = (Object.keys(draft) as (keyof AvatarConfig)[]).some((key) => draft[key] !== state.saved[key]);
  const isDefault = (Object.keys(draft) as (keyof AvatarConfig)[]).every(
    (key) => draft[key] === DEFAULT_SITE_AVATAR[key],
  );
  const update = (change: Partial<AvatarConfig>) => {
    edit((current) => ({ ...current, ...change }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <AvatarEditor
        value={draft}
        onChange={(next) => update(next)}
        outline
        previewSize={140}
        style={editorTheme}
      />
      <div className="space-y-6">
        {!canSave ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">
            Saving is off on this deployment. It needs a Convex URL and <code>CONVEX_SERVER_SECRET</code>{" "}
            (see CLAUDE.md), then a redeploy.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void submit()}
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
          {notice ? (
            <p role="status" className="text-sm text-[var(--muted)]">
              {notice.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
