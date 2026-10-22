"use client";

import { play } from "cuelume";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AdminAvatarSettings } from "@/components/admin-avatar-settings";
import { serif } from "@/components/booking-button";
import { Modal } from "@/components/modal";
import {
  MODEL_OPTIONS,
  getDefaultModelId,
  type ModelId,
} from "@/lib/models";

const inputClass =
  "w-full rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-strong)]";

function Section({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
      <div className="space-y-2 border-b border-[var(--border)] pb-5">
        <h2 className={`text-2xl tracking-[-0.02em] ${serif}`}>{title}</h2>
        <div className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

// Loads locked: the settings sit blurred behind a password dialog. Unlocking checks the
// password (POST /api/admin/verify) and keeps it in memory only, to send with each save.
export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);

  return (
    <main className="site-page px-4 py-6 sm:px-6 sm:py-10">
      <div
        inert={password === null}
        aria-hidden={password === null}
        className={`mx-auto max-w-4xl space-y-6 transition-[filter] duration-500 ${
          password === null ? "pointer-events-none select-none blur-md" : ""
        }`}
      >
        <div className="space-y-2 px-1">
          <p className="eyebrow text-xs text-[var(--muted)]">Admin</p>
          <h1 className={`text-4xl tracking-[-0.04em] ${serif}`}>Site settings</h1>
        </div>

        <Section
          title="Skaffen’s avatar"
          description="The avatar every visitor sees in the header. Saved to Vercel Edge Config; until something is saved, the site uses SITE.assistant.avatar."
        >
          <AdminAvatarSettings password={password ?? ""} onLocked={() => setPassword(null)} />
        </Section>

        <Section
          title="Model"
          description="Which model the assistant uses in this browser only. Saving stores a signed httpOnly cookie for 30 days. Every other visitor keeps the default model (set with DEFAULT_MODEL)."
        >
          <ModelSwitcher password={password ?? ""} onLocked={() => setPassword(null)} />
        </Section>
      </div>

      {password === null ? <UnlockDialog onUnlock={setPassword} /> : null}
    </main>
  );
}

function UnlockDialog({ onUnlock }: { onUnlock: (password: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      if (response.ok) {
        play("success");
        onUnlock(value);
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      play("error");
      setError(payload.error ?? "Unable to unlock.");
      inputRef.current?.select();
    } catch {
      play("error");
      setError("Request failed. Try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    // There is nothing behind the dialog to go back to, so Escape and the backdrop
    // keep it open; "Back to the site" leaves.
    <Modal labelledBy="admin-unlock-title" onClose={() => {}} initialFocusRef={inputRef}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-7"
      >
        <div className="space-y-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]">
            <Lock size={18} aria-hidden />
          </span>
          <h2 id="admin-unlock-title" className={`text-2xl tracking-[-0.02em] ${serif}`}>
            Site settings
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">Enter the admin password to change site settings.</p>
        </div>
        <label className="block space-y-2">
          <span className="sr-only">Admin password</span>
          <input
            ref={inputRef}
            className={inputClass}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Admin password"
            type="password"
            autoComplete="current-password"
            value={value}
            aria-invalid={error !== null}
            aria-describedby={error ? "admin-unlock-error" : undefined}
          />
        </label>
        {error ? (
          <p id="admin-unlock-error" role="alert" className="text-sm text-[var(--muted)]">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline">
            Back to the site
          </Link>
          <button
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-60"
            disabled={isChecking || value.length === 0}
            type="submit"
            data-cuelume-press="tick"
          >
            {isChecking ? "Checking..." : "Unlock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModelSwitcher({ password, onLocked }: { password: string; onLocked: () => void }) {
  const [model, setModel] = useState<ModelId>(getDefaultModelId());
  const [isOverride, setIsOverride] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/model")
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as {
          model?: string;
          isOverride?: boolean;
        };
        if (cancelled) return;
        const known = MODEL_OPTIONS.find((option) => option.id === payload.model);
        if (known) setModel(known.id);
        setIsOverride(payload.isOverride === true);
      })
      .catch(() => {
        // Cookie is httpOnly; without the API the page can only show the default.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (response.status === 401) {
        play("error");
        onLocked();
        return;
      }
      if (!response.ok) {
        play("error");
        setStatus(payload.error ?? "Unable to update model.");
        return;
      }

      play("success");
      setIsOverride(true);
      setStatus(`Model saved for this browser: ${model}`);
    } catch {
      play("error");
      setStatus("Request failed before the model could be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <p className="text-sm text-[var(--muted)]">
        {isOverride
          ? "Signed cookie: active override for this browser."
          : "Signed cookie: none. Using the default model."}
      </p>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Model</span>
        <select
          className={inputClass}
          onChange={(event) => setModel(event.target.value as ModelId)}
          value={model}
        >
          {MODEL_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} ({option.provider})
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODEL_OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`rounded-[1.25rem] border p-4 text-sm ${
              option.id === model
                ? "border-[var(--border-strong)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]"
            }`}
          >
            <div className="font-medium">{option.label}</div>
            <div className="mt-1 leading-6">{option.description}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-85 disabled:opacity-60"
          disabled={isSaving}
          type="submit"
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          {isSaving ? "Saving..." : "Save model"}
        </button>
        {status ? (
          <p role="status" className="text-sm text-[var(--muted)]">
            {status}
          </p>
        ) : null}
      </div>
    </form>
  );
}
