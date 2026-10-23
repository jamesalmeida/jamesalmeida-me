"use client";

import { play } from "cuelume";
import { ArrowLeft, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AdminAvatarSettings } from "@/components/admin-avatar-settings";
import { AdminLandingSettings } from "@/components/admin-landing-settings";
import { AdminMotionSettings } from "@/components/admin-motion-settings";
import {
  Insights,
  Leads,
  NotConfiguredNotice,
  RangePicker,
  TranscriptDialog,
  useAdminDashboard,
} from "@/components/admin-dashboard";
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

type Tab = "insights" | "leads" | "settings";
const TABS: { id: Tab; label: string }[] = [
  { id: "insights", label: "Insights" },
  { id: "leads", label: "Leads" },
  { id: "settings", label: "Settings" },
];

// Loads locked: the page sits blurred behind a password dialog until this browser
// has an admin session (POST /api/admin/verify sets a signed httpOnly cookie for 12
// hours). A 401 from any admin route locks it again.
export default function AdminPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("insights");
  const [openConversation, setOpenConversation] = useState<string | null>(null);
  const lock = useCallback(() => setSignedIn(false), []);

  useEffect(() => {
    fetch("/api/admin/verify", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { signedIn?: boolean }) => setSignedIn(payload.signedIn === true))
      .catch(() => setSignedIn(false));
  }, []);

  const handleLock = async () => {
    await fetch("/api/admin/verify", { method: "DELETE" }).catch(() => {});
    setSignedIn(false);
  };

  const isLocked = signedIn !== true;

  return (
    <main className="site-page px-4 py-6 sm:px-6 sm:py-10">
      <div
        inert={isLocked}
        aria-hidden={isLocked}
        className={`mx-auto max-w-6xl space-y-6 transition-[filter] duration-500 ${
          isLocked ? "pointer-events-none select-none blur-md" : ""
        }`}
      >
        <div className="flex flex-wrap items-end justify-between gap-4 px-1">
          <div className="space-y-2">
            <p className="eyebrow text-xs text-[var(--muted)]">Admin</p>
            <h1 className={`text-4xl tracking-[-0.04em] ${serif}`}>jamesalmeida.me</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* A full page load, not a client-side Link: the router would reuse its
                cached copy of / and hide a just-saved avatar. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium transition hover:border-[var(--foreground)]"
            >
              <ArrowLeft size={14} aria-hidden />
              Back to site
            </a>
            <button
              type="button"
              onClick={handleLock}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm font-medium transition hover:border-[var(--foreground)]"
            >
              <Lock size={14} aria-hidden />
              Lock
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Admin sections" className="flex gap-1.5 px-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === id ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {signedIn ? (
          tab === "settings" ? (
            <>
              <Section
                title="Skaffen’s avatar"
                description="The avatar every visitor sees in the header. Saved to the site database; until something is saved, the site uses SITE.assistant.avatar."
              >
                <AdminAvatarSettings onLocked={lock} />
              </Section>
              <Section
                title="Landing"
                description="The headlines in the A/B test, the example prompts in the composer and how long each one shows. Saved for every visitor; Insights shows how each one does."
              >
                <AdminLandingSettings onLocked={lock} />
              </Section>
              <Section
                title="Motion"
                description="How fast the chat's animations run, and how long Skaffen always thinks before a reply shows. Saved for every visitor."
              >
                <AdminMotionSettings onLocked={lock} />
              </Section>
              <Section
                title="Model"
                description="Which model the assistant uses in this browser only. Saving stores a signed httpOnly cookie for 30 days. Every other visitor keeps the default model (set with DEFAULT_MODEL)."
              >
                <ModelSwitcher onLocked={lock} />
              </Section>
            </>
          ) : (
            <DashboardTabs tab={tab} onLocked={lock} onOpenConversation={setOpenConversation} />
          )
        ) : (
          <div className="h-[60dvh] rounded-[2rem] border border-[var(--border)] bg-[var(--panel)]" />
        )}
      </div>

      {signedIn === false ? <UnlockDialog onUnlock={() => setSignedIn(true)} /> : null}
      {openConversation && signedIn ? (
        <TranscriptDialog conversationId={openConversation} onClose={() => setOpenConversation(null)} onLocked={lock} />
      ) : null}
    </main>
  );
}

function DashboardTabs({
  tab,
  onLocked,
  onOpenConversation,
}: {
  tab: Tab;
  onLocked: () => void;
  onOpenConversation: (id: string) => void;
}) {
  const { days, setDays, state, reload } = useAdminDashboard(onLocked);

  if (state.status === "loading") return <p className="px-1 text-sm text-[var(--muted)]">Loading…</p>;
  if (state.status === "unconfigured") return <NotConfiguredNotice />;
  if (state.status === "error") {
    return (
      <p role="alert" className="px-1 text-sm text-[var(--muted)]">
        {state.message}{" "}
        <button type="button" onClick={reload} className="underline underline-offset-4">
          Retry
        </button>
      </p>
    );
  }
  if (tab === "leads") {
    return <Leads leads={state.leads} onOpenConversation={onOpenConversation} onDeleted={reload} />;
  }
  return (
    <div className="space-y-4">
      <div className="px-1">
        <RangePicker days={days} onChange={setDays} />
      </div>
      <Insights dashboard={state.dashboard} onOpenConversation={onOpenConversation} />
    </div>
  );
}

function UnlockDialog({ onUnlock }: { onUnlock: () => void }) {
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
        onUnlock();
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
            Admin
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)]">Enter the admin password to see insights and change site settings.</p>
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
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full load, see above */}
          <a href="/" className="text-sm text-[var(--muted)] underline-offset-4 hover:underline">
            Back to the site
          </a>
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

function ModelSwitcher({ onLocked }: { onLocked: () => void }) {
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
        body: JSON.stringify({ model }),
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
