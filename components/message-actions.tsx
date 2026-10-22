"use client";

import { useMessage, useThread } from "@assistant-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  DOWN_REASONS,
  MAX_FEEDBACK_DETAILS_CHARS,
  buildFeedbackPayload,
  submitFeedback,
  type FeedbackRating,
} from "@/lib/feedback";
import { Modal } from "./modal";

const COPIED_MS = 1800;

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full transition-colors";

// Thumbs up/down and copy, under a finished Skaffen reply.
export function MessageActions() {
  const messageId = useMessage((message) => message.id);
  const text = useMessage((message) =>
    message.content
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n\n")
      .trim(),
  );
  // Stored with the feedback: the conversation (its first message id, as in
  // /api/chat) and the visitor's message this reply answered.
  const conversationId = useThread((thread) => thread.messages[0]?.id);
  const userText = useThread((thread) => {
    const index = thread.messages.findIndex((message) => message.id === messageId);
    for (let i = index - 1; i >= 0; i -= 1) {
      const message = thread.messages[i];
      if (message.role !== "user") continue;
      return message.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n\n");
    }
    return "";
  });
  const feedback = (input: { rating: FeedbackRating | null; reasons?: string[]; details?: string }) =>
    buildFeedbackPayload({ ...input, messageId, conversationId, replyText: text, userText });
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [isThanksOpen, setIsThanksOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasSentDetails, setHasSentDetails] = useState(false);

  const rate = (next: FeedbackRating) => {
    if (rating === next) {
      setRating(null);
      setIsThanksOpen(false);
      submitFeedback(feedback({ rating: null }));
      return;
    }
    setRating(next);
    setHasSentDetails(false);
    setIsThanksOpen(true);
    submitFeedback(feedback({ rating: next }));
  };

  return (
    <div className="relative flex items-center gap-2">
      <div
        role="group"
        aria-label="Rate this reply"
        className="flex items-center rounded-full bg-[var(--surface-muted)] p-0.5"
      >
        <RatingButton
          label="Good reply"
          isSelected={rating === "up"}
          onClick={() => rate("up")}
          icon={<ThumbsUp size={18} aria-hidden />}
        />
        <RatingButton
          label="Bad reply"
          isSelected={rating === "down"}
          onClick={() => rate("down")}
          icon={<ThumbsDown size={18} aria-hidden />}
        />
      </div>
      <CopyButton text={text} />

      <AnimatePresence>
        {isThanksOpen && rating ? (
          <ThanksPopover
            key="thanks"
            canShareMore={!hasSentDetails}
            onClose={() => setIsThanksOpen(false)}
            onShareMore={() => {
              setIsThanksOpen(false);
              setIsFormOpen(true);
            }}
          />
        ) : null}
      </AnimatePresence>

      {isFormOpen && rating ? (
        <FeedbackForm
          rating={rating}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(reasons, details) => {
            submitFeedback(feedback({ rating, reasons, details }));
            setHasSentDetails(true);
            setIsFormOpen(false);
            setIsThanksOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}

function RatingButton({
  label,
  isSelected,
  onClick,
  icon,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isSelected}
      title={label}
      className={`relative ${iconButtonClass} ${
        isSelected ? "text-[var(--accent-foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
      data-cuelume-press="tick"
    >
      <AnimatePresence>
        {isSelected ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-[var(--accent)]"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ) : null}
      </AnimatePresence>
      <span className="relative">{icon}</span>
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setIsCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setIsCopied(false), COPIED_MS);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={isCopied ? "Copied" : "Copy reply"}
      title={isCopied ? "Copied" : "Copy"}
      className={`${iconButtonClass} bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)]`}
      data-cuelume-press="tick"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCopied ? (
          <motion.span
            key="check"
            className="text-[var(--foreground)]"
            initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 26 }}
          >
            <Check size={18} strokeWidth={2.5} aria-hidden />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={18} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {isCopied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}

// A small card above the buttons. Closes on its button, Escape or a click elsewhere.
function ThanksPopover({
  canShareMore,
  onClose,
  onShareMore,
}: {
  canShareMore: boolean;
  onClose: () => void;
  onShareMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onCloseRef.current();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      role="status"
      className="absolute bottom-full left-0 z-20 mb-3 w-[min(22rem,calc(100vw-2rem))] origin-bottom-left rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.14)]"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold">Thank you</p>
          <p className="mt-0.5 text-[15px] text-[var(--muted)]">
            Your feedback helps James improve this site.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] transition hover:opacity-80"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      {canShareMore ? (
        <button
          type="button"
          onClick={onShareMore}
          className="mt-4 rounded-full bg-[var(--surface-muted)] px-5 py-2.5 text-[15px] font-semibold transition hover:opacity-80"
          data-cuelume-press="tick"
        >
          Share more feedback
        </button>
      ) : null}
    </motion.div>
  );
}

function FeedbackForm({
  rating,
  onClose,
  onSubmit,
}: {
  rating: FeedbackRating;
  onClose: () => void;
  onSubmit: (reasons: string[], details: string) => void;
}) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const titleId = useId();
  const detailsId = useId();
  const isDown = rating === "down";
  const canSubmit = reasons.length > 0 || details.trim().length > 0;

  const toggleReason = (reason: string) =>
    setReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    );

  return (
    <Modal labelledBy={titleId} onClose={onClose}>
      <form
        className="relative w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(reasons, details);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="h-10 w-10" aria-hidden />
          <h2 id={titleId} className="text-center text-[17px] font-semibold">
            {isDown ? "What could be better?" : "What was helpful?"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] transition hover:opacity-80"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {isDown ? (
          <div className="mt-5 flex flex-col gap-2.5" role="group" aria-label="Reasons">
            {DOWN_REASONS.map((reason) => {
              const isSelected = reasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  aria-pressed={isSelected}
                  className={`rounded-[1.1rem] border px-4 py-3.5 text-left text-[15px] transition ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "border-[var(--border-strong)] hover:border-[var(--foreground)]"
                  }`}
                  data-cuelume-press="tick"
                >
                  {reason}
                </button>
              );
            })}
          </div>
        ) : null}

        <label htmlFor={detailsId} className="sr-only">
          {isDown ? "Add details (optional)" : "Add details"}
        </label>
        <textarea
          id={detailsId}
          rows={4}
          maxLength={MAX_FEEDBACK_DETAILS_CHARS}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={isDown ? "Add details (optional)" : "Add details"}
          className="mt-4 w-full resize-none rounded-[1.1rem] border border-[var(--border-strong)] bg-transparent px-4 py-3 text-[15px] leading-6 outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--foreground)]"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 h-12 w-full rounded-full bg-[var(--accent)] text-[15px] font-semibold text-[var(--accent-foreground)] transition hover:opacity-90 disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted)] disabled:hover:opacity-100"
          data-cuelume-press="tick"
        >
          Submit
        </button>
      </form>
    </Modal>
  );
}
