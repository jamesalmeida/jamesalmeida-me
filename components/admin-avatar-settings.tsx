"use client";

import { AvatarEditor, type AvatarConfig } from "@jamesalmeida/agent-avatars";
import { play } from "cuelume";
import { useEffect, useState, type CSSProperties } from "react";
import { DEFAULT_SITE_AVATAR } from "@/lib/avatar-settings";

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
  const [saved, setSaved] = useState<AvatarConfig>(DEFAULT_SITE_AVATAR);
  const [draft, setDraft] = useState<AvatarConfig>(DEFAULT_SITE_AVATAR);
  const [canSave, setCanSave] = useState(true);
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
