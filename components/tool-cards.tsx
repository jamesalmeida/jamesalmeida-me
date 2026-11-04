"use client";

import { makeAssistantToolUI, useThread } from "@assistant-ui/react";
import { play } from "cuelume";
import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/data/site";
import {
  BRIEF_FIELDS,
  MAX_BRIEF_FIELD_CHARS,
  MAX_NOTE_CHARS,
  briefBookingHref,
  briefEntries,
  briefMailtoHref,
  type Brief,
  type BriefLead,
} from "@/lib/brief";
import { trackEvent } from "@/lib/visit";
import { BookingButton, BookingCard, EmailButton, outlineButtonClass, primaryButtonClass, serif } from "./booking-button";

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

function BriefCard({ initial, lead = "book" }: { initial: Brief; lead?: BriefLead }) {
  const conversationId = useConversationId();
  const [brief, setBrief] = useState(initial);
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasOpenedForm, setHasOpenedForm] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const titleId = useId();
  const fieldId = useId();
  const entries = briefEntries(brief);
  // Only fields with something in them, plus the ones new briefs use, so old ones stay editable.
  const editableFields = BRIEF_FIELDS.filter(({ key }) => key !== "tried" || brief.tried);

  const bookingHref = briefBookingHref(SITE.bookingUrl, brief);
  const sendLeads = lead === "note";

  // Hidden rather than unmounted, so "Not yet" keeps what the visitor typed in the form.
  return (
    <>
    {isDismissed ? (
      <div
        data-conversation-id={conversationId}
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-3"
      >
        <p className="text-[15px] leading-6 text-[var(--muted)]">No problem. Your brief is here when you want it.</p>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="py-1.5 text-[15px] text-[var(--accent)] underline underline-offset-4"
          data-cuelume-press="tick"
        >
          Show it
        </button>
      </div>
    ) : null}
    <section
      hidden={isDismissed}
      aria-labelledby={titleId}
      data-conversation-id={conversationId}
      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 id={titleId} className={`text-2xl tracking-[-0.02em] ${serif} sm:text-[28px]`}>
          Does this look right?
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
          {editableFields.map(({ key, label }) => (
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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {sendLeads && !isSent ? null : <BookingButton href={bookingHref} variant={isSent ? "outline" : "primary"} />}
        {isSent ? null : (
          <button
            type="button"
            onClick={() => {
              setHasOpenedForm(true);
              setIsSending((value) => !value);
            }}
            aria-expanded={isSending}
            className={sendLeads ? primaryButtonClass : outlineButtonClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            <Send size={18} aria-hidden />
            Send to James
          </button>
        )}
        {sendLeads && !isSent ? <BookingButton href={bookingHref} variant="outline" /> : null}
        {isSent ? null : (
          <button
            type="button"
            onClick={() => {
              trackEvent("offer_declined", conversationId);
              setIsDismissed(true);
            }}
            className="h-12 px-2 text-[15px] text-[var(--muted)] underline underline-offset-4 transition hover:text-[var(--foreground)]"
            data-cuelume-press="tick"
          >
            Not yet
          </button>
        )}
      </div>
      {isSent ? (
        <p role="status" className="mt-5 rounded-[1rem] bg-[var(--surface-muted)] px-4 py-3 text-[15px] leading-6">
          Thanks. James has your email and this brief.
        </p>
      ) : hasOpenedForm ? (
        <SendForm brief={brief} conversationId={conversationId} open={isSending} onSent={() => setIsSent(true)} />
      ) : null}
      <p className="mt-4 text-[13px] leading-5 text-[var(--muted)]">
        James only gets this as a message if you send it or book.{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--foreground)]">
          Your privacy
        </Link>
      </p>
    </section>
    </>
  );
}

// "Send to James": saved as a lead (POST /api/leads) with the brief as it reads now and
// the visitor's note. James gets exactly that. When saving isn't available, the email
// button sends the same thing from the visitor's own mail app.
function SendForm({
  brief,
  conversationId,
  open,
  onSent,
}: {
  brief: Brief;
  conversationId?: string;
  open: boolean;
  onSent: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEmailInstead, setCanEmailInstead] = useState(false);
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Opening the form moves focus into it and brings Send out from behind the composer.
  useEffect(() => {
    if (!open) return;
    emailRef.current?.focus({ preventScroll: true });
    formRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCanEmailInstead(false);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, note, brief, conversationId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(response.status === 400 && payload.error ? payload.error : "");
      }
      play("success");
      onSent();
    } catch (caught) {
      play("error");
      setIsSubmitting(false);
      const message = caught instanceof Error ? caught.message : "";
      setCanEmailInstead(!message);
      setError(message || "That didn't go through. You can email it to James instead.");
    }
  };

  const inputClass =
    "h-12 min-w-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-[15px] outline-none transition focus:border-[var(--border-strong)]";

  return (
    <form ref={formRef} hidden={!open} onSubmit={handleSubmit} className="mt-5 scroll-mb-40 border-t border-[var(--border)] pt-5">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="sr-only" htmlFor={`${fieldId}-email`}>
          Email
        </label>
        <input
          ref={emailRef}
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
          className={`${inputClass} sm:flex-1`}
        />
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
          className={`${inputClass} sm:w-44`}
        />
      </div>
      <label className="mt-3 block text-sm text-[var(--muted)]" htmlFor={`${fieldId}-note`}>
        Anything to add? (optional)
      </label>
      <textarea
        id={`${fieldId}-note`}
        rows={2}
        maxLength={MAX_NOTE_CHARS}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-1.5 w-full resize-none rounded-[0.9rem] border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] leading-6 outline-none transition focus:border-[var(--border-strong)]"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${outlineButtonClass} disabled:opacity-60`}
          data-cuelume-press="tick"
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>
        <p className="text-[13px] leading-5 text-[var(--muted)]">Your message to James is what&apos;s above, plus your note.</p>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
          {error}
        </p>
      ) : null}
      {canEmailInstead ? (
        <div className="mt-3">
          <EmailButton href={briefMailtoHref(SITE.email, brief, note)} />
        </div>
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

export const ShowBriefToolUI = makeAssistantToolUI<Brief, { brief: Brief; lead?: BriefLead }>({
  toolName: "showBrief",
  // Waits for the result, so the card's editable copy starts from the full brief
  // rather than half-streamed args.
  render: ({ result }) => {
    if (!result) return null;
    const brief = toBrief(result.brief);
    if (briefEntries(brief).length === 0) return null;
    return <BriefCard initial={brief} lead={result.lead === "note" ? "note" : "book"} />;
  },
});
