"use client";

import { makeAssistantToolUI, useThread } from "@assistant-ui/react";
import { play } from "cuelume";
import { useId, useState, type FormEvent } from "react";
import { SITE } from "@/data/site";
import {
  BRIEF_FIELDS,
  MAX_BRIEF_FIELD_CHARS,
  briefBookingHref,
  briefEntries,
  briefMailtoHref,
  type Brief,
} from "@/lib/brief";
import { BookingButton, BookingCard, EmailButton, outlineButtonClass, serif } from "./booking-button";

// Only known string fields are kept, each capped like the server does.
function toBrief(value: unknown): Brief {
  if (!value || typeof value !== "object") return {};
  const candidate = value as Record<string, unknown>;
  const brief: Brief = {};
  for (const { key } of BRIEF_FIELDS) {
    const field = candidate[key];
    if (typeof field === "string" && field.trim()) {
      brief[key] = field.trim().slice(0, MAX_BRIEF_FIELD_CHARS);
    }
  }
  return brief;
}

// The conversation id the server uses: the thread's first message id (see /api/chat).
function useConversationId() {
  return useThread((thread) => thread.messages[0]?.id);
}

function BriefCard({ initial }: { initial: Brief }) {
  const conversationId = useConversationId();
  const [brief, setBrief] = useState(initial);
  const [isEditing, setIsEditing] = useState(false);
  const titleId = useId();
  const fieldId = useId();
  const entries = briefEntries(brief);

  return (
    <section
      aria-labelledby={titleId}
      data-conversation-id={conversationId}
      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={titleId} className={`text-2xl tracking-[-0.02em] ${serif} sm:text-[28px]`}>
          Your brief
        </h3>
        <button
          type="button"
          onClick={() => setIsEditing((value) => !value)}
          className="py-2.5 text-[15px] text-[var(--accent)] underline underline-offset-4"
          aria-expanded={isEditing}
          data-cuelume-press="tick"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        <div className="mt-4 flex flex-col gap-4">
          {BRIEF_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`${fieldId}-${key}`} className="text-sm text-[var(--muted)]">
                {label}
              </label>
              <textarea
                id={`${fieldId}-${key}`}
                rows={2}
                maxLength={MAX_BRIEF_FIELD_CHARS}
                value={brief[key] ?? ""}
                onChange={(event) => setBrief((current) => ({ ...current, [key]: event.target.value }))}
                className="resize-none rounded-[0.9rem] border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] leading-6 outline-none transition focus:border-[var(--border-strong)]"
              />
            </div>
          ))}
        </div>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2.5 text-[15px] leading-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:text-base">
          {entries.map(({ key, label, value }) => (
            <div key={key} className="contents">
              <dt className="text-sm text-[var(--muted)] sm:text-base">{label}</dt>
              <dd className="mb-1.5 sm:mb-0">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <BookingButton href={briefBookingHref(SITE.bookingUrl, brief)} />
        <EmailButton href={briefMailtoHref(SITE.email, brief)} />
      </div>
      <FollowUpForm brief={brief} conversationId={conversationId} />
      <p className="mt-4 text-[13px] leading-5 text-[var(--muted)]">
        Nothing is sent until you choose. The brief goes into your email or booking notes, or
        to James with your email address if you leave it.
      </p>
    </section>
  );
}

// Optional: the visitor leaves their email so James can follow up. Saved as a lead
// (POST /api/leads) with the brief as it reads now.
function FollowUpForm({ brief, conversationId }: { brief: Brief; conversationId?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, brief, conversationId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(response.status === 400 && payload.error ? payload.error : "");
      }
      play("success");
      setStatus("sent");
    } catch (caught) {
      play("error");
      setStatus("idle");
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : `That didn't go through. You can email ${SITE.email} instead.`,
      );
    }
  };

  if (status === "sent") {
    return (
      <p role="status" className="mt-6 rounded-[1rem] bg-[var(--surface-muted)] px-4 py-3 text-[15px] leading-6">
        Thanks. James has your email and this brief.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 border-t border-[var(--border)] pt-5" aria-describedby={`${fieldId}-hint`}>
      <p id={`${fieldId}-hint`} className="text-[15px] leading-6">
        Not ready to book? Leave your email and James can follow up.
      </p>
      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <label className="sr-only" htmlFor={`${fieldId}-name`}>
          Name (optional)
        </label>
        <input
          id={`${fieldId}-name`}
          type="text"
          autoComplete="name"
          maxLength={100}
          placeholder="Name (optional)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-12 min-w-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-[15px] outline-none transition focus:border-[var(--border-strong)] sm:w-40"
        />
        <label className="sr-only" htmlFor={`${fieldId}-email`}>
          Email
        </label>
        <input
          id={`${fieldId}-email`}
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error !== null}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="h-12 min-w-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-[15px] outline-none transition focus:border-[var(--border-strong)] sm:flex-1"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={`${outlineButtonClass} disabled:opacity-60`}
          data-cuelume-press="tick"
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function BookingToolCard() {
  const conversationId = useConversationId();
  return (
    <div data-conversation-id={conversationId}>
      <BookingCard />
    </div>
  );
}

export const ShowBookingCtaToolUI = makeAssistantToolUI<
  Record<string, never>,
  { bookingUrl: string; bookingLabel: string; email: string }
>({
  toolName: "showBookingCta",
  render: () => <BookingToolCard />,
});

export const ShowBriefToolUI = makeAssistantToolUI<Brief, { brief: Brief }>({
  toolName: "showBrief",
  // Waits for the result, so the card's editable copy starts from the full brief
  // rather than half-streamed args.
  render: ({ result }) => {
    if (!result) return null;
    const brief = toBrief(result.brief);
    if (briefEntries(brief).length === 0) return null;
    return <BriefCard initial={brief} />;
  },
});
