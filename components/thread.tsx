"use client";

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  MessagePartPrimitive,
  ThreadPrimitive,
  useComposer,
  useComposerRuntime,
  useMessage,
  useThread,
  useThreadComposer,
  type ThreadMessage,
  useThreadViewport,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { play } from "cuelume";
import { ArrowDown, ArrowUp, Square } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { HEADLINES, PROMPT_EXAMPLES, SITE } from "@/data/site";
import type { AvatarMood } from "@/lib/avatar";
import { toUIMessages } from "@/lib/message-convert";
import { serif } from "./booking-button";
import { MessageActions } from "./message-actions";
import { PrivacyNotice } from "./privacy-notice";
import { SkaffenAvatar, useHappyMoment } from "./skaffen-avatar";
import { ShowBookingCtaToolUI, ShowBriefToolUI } from "./tool-cards";

type ThreadProps = {
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
  onReply?: (text: string) => void;
  onRunComplete?: (messages: UIMessage[]) => void;
};

// Matches the server's per-part cap in lib/sanitize-messages.ts.
const MAX_MESSAGE_CHARS = 2000;
const CHAR_COUNTER_FROM = 1800;

const BLOCKED_MESSAGE =
  "You're sending messages too fast. Please wait a minute and try again, or email james@gsv.to.";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again, or email james@gsv.to.";

// The transport shows the raw response body as the error, so replace rate-limit (429)
// and bot-check (403) responses with a short friendly message.
const chatFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status === 429 || response.status === 403) {
    throw new Error(BLOCKED_MESSAGE);
  }
  return response;
};

// Created once: a new transport per render is wasted work.
const chatTransport = new DefaultChatTransport({ api: "/api/chat", fetch: chatFetch });

// Ids of the messages the thread mounted with. Only messages sent or received after
// that animate in, so a restored chat doesn't replay its whole history.
const InitialMessageIdsContext = createContext<ReadonlySet<string>>(new Set());

function useIsNewMessage() {
  const initialIds = useContext(InitialMessageIdsContext);
  const id = useMessage((message) => message.id);
  return !initialIds.has(id);
}

// The composer moves from the landing to the bottom with a shared layout animation.
const composerLayoutTransition = { type: "spring", stiffness: 320, damping: 34 } as const;

export function Thread({ initialMessages, onMessagesChange, onReply, onRunComplete }: ThreadProps) {
  // The AI SDK chat's error. A run that fails before any assistant content (a 429,
  // a 403, or a stream that errors right after "start") creates no assistant
  // message, so MessagePrimitive.Error has nothing to render in; RunErrorNotice does.
  const [runError, setRunError] = useState<string | null>(null);
  const clearRunError = useCallback(() => setRunError(null), []);
  const runtime = useChatRuntime({
    messages: initialMessages,
    transport: chatTransport,
    onError: (error) => {
      setRunError(error.message === BLOCKED_MESSAGE ? BLOCKED_MESSAGE : GENERIC_ERROR_MESSAGE);
    },
  });
  // Set by the Stop button. A stopped run still ends with a "complete" status.
  const cancelledRef = useRef(false);
  const [initialIds] = useState(() => new Set(initialMessages.map((message) => message.id)));

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <InitialMessageIdsContext.Provider value={initialIds}>
      <ShowBookingCtaToolUI />
      <ShowBriefToolUI />
      <ThreadPersistence onMessagesChange={onMessagesChange} />
      <RunCompleteDetector
        cancelledRef={cancelledRef}
        onReply={onReply}
        onRunComplete={onRunComplete}
        onRunStart={clearRunError}
      />
      <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
        <ThreadBody runError={runError} onCancel={() => { cancelledRef.current = true; }} />
      </ThreadPrimitive.Root>
      </InitialMessageIdsContext.Provider>
    </AssistantRuntimeProvider>
  );
}

// The landing (a question and a big composer) until the first message, then the
// conversation with the composer docked at the bottom. On the first send the landing
// fades up and away while the composer glides down to the dock.
function ThreadBody({ onCancel, runError }: { onCancel: () => void; runError: string | null }) {
  const isEmpty = useThread((state) => state.messages.length === 0);

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {isEmpty ? (
            <motion.div
              key="landing"
              className="absolute inset-0 flex flex-col overflow-y-auto"
              exit={{ opacity: 0, y: -32, pointerEvents: "none" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 pb-16 pt-4 sm:gap-7 sm:px-12 sm:pb-20">
                <h1
                  className={`max-w-[1000px] text-center text-[44px] font-normal leading-[1.05] tracking-[-0.02em] sm:text-[72px] lg:text-[88px] lg:leading-[1.02] ${serif}`}
                >
                  {HEADLINES[0]}
                </h1>
                <p className="max-w-[720px] text-center text-[17px] leading-[1.5] text-[var(--muted)] sm:text-[22px]">
                  {SITE.subhead}
                </p>
                <div className="mt-3 w-full max-w-[780px] sm:mt-5">
                  <Composer variant="landing" onCancel={onCancel} />
                </div>
              </div>
              <PrivacyNotice className="px-4 pb-5 sm:px-12 sm:pb-6" />
            </motion.div>
          ) : null}
        </AnimatePresence>
        {isEmpty ? null : (
          <>
            <h1 className="sr-only">Chat with {SITE.assistant.name}, {SITE.assistant.role}</h1>
            <ThreadPrimitive.Viewport className="absolute inset-0 overflow-y-auto px-4 pb-10 pt-4 sm:px-12 sm:pt-6">
              <div className="mx-auto flex w-full max-w-[760px] flex-col gap-7">
                <ThreadPrimitive.Messages
                  components={{
                    AssistantMessage: AssistantMessage,
                    UserMessage: UserMessage,
                  }}
                />
                <RunErrorNotice error={runError} />
              </div>
            </ThreadPrimitive.Viewport>
            <ScrollToBottomButton />
          </>
        )}
      </div>
      {isEmpty ? null : (
        <div className="border-t border-[var(--border)] px-4 pb-5 pt-3 sm:px-12 sm:pb-6 sm:pt-6">
          <div className="mx-auto w-full max-w-[780px]">
            <Composer variant="dock" onCancel={onCancel} />
          </div>
          <PrivacyNotice className="mt-2.5" />
        </div>
      )}
    </>
  );
}

// The last message, if it is an assistant reply that finished without an error or
// a cancel and has some content (text or a tool card).
function getCompletedReply(messages: readonly ThreadMessage[], cancelled: boolean) {
  const last = messages[messages.length - 1];
  if (cancelled || last?.role !== "assistant" || last.status.type !== "complete") return null;
  return toUIMessages([last]).length > 0 ? last : null;
}

// After each run: announces a completed reply (via onReply) and fires onRunComplete
// once, after the first completed reply in this Thread instance. Used to auto-fork
// static threads into history, so failed or stopped runs don't fork.
function RunCompleteDetector({
  cancelledRef,
  onReply,
  onRunComplete,
  onRunStart,
}: {
  cancelledRef: RefObject<boolean>;
  onReply?: (text: string) => void;
  onRunComplete?: (messages: UIMessage[]) => void;
  onRunStart?: () => void;
}) {
  const isRunning = useThread((state) => state.isRunning);
  const messages = useThread((state) => state.messages);
  const prevRunning = useRef(false);
  const hasFired = useRef(false);

  useEffect(() => {
    const justStarted = !prevRunning.current && isRunning;
    const justFinished = prevRunning.current && !isRunning;
    prevRunning.current = isRunning;

    if (justStarted) {
      cancelledRef.current = false;
      onRunStart?.();
    }
    if (!justFinished || messages.length === 0) return;

    play("ready");

    const reply = getCompletedReply(messages, cancelledRef.current);
    if (!reply) return;

    const text = reply.content
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join("\n\n")
      .trim();
    if (text) onReply?.(text);

    if (hasFired.current || !onRunComplete) return;
    hasFired.current = true;
    onRunComplete(toUIMessages(messages));
  }, [cancelledRef, isRunning, messages, onReply, onRunComplete, onRunStart]);

  return null;
}

function ScrollToBottomButton() {
  const isAtBottom = useThreadViewport((state) => state.isAtBottom);
  const scrollToBottom = useThreadViewport((state) => state.scrollToBottom);

  return (
    <AnimatePresence>
      {!isAtBottom && (
        <motion.button
          type="button"
          onClick={() => scrollToBottom({ behavior: "smooth" })}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bottom-4 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
          aria-label="Scroll to latest message"
          data-cuelume-press="tick"
        >
          <ArrowDown size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function hasVisibleContent(message: ThreadMessage) {
  return message.content.some(
    (part) => (part.type === "text" && part.text.length > 0) || part.type === "tool-call",
  );
}

// Shows the last run's error under the last user message when the run failed
// before the assistant produced any content. Errors after some content show
// inside the assistant message (MessagePrimitive.Error).
function RunErrorNotice({ error }: { error: string | null }) {
  const isRunning = useThread((state) => state.isRunning);
  const last = useThread((state) => state.messages[state.messages.length - 1]);
  if (!error || isRunning || !last) return null;
  if (last.role === "assistant" && hasVisibleContent(last)) return null;

  return (
    <p
      role="alert"
      className="self-start rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {error}
    </p>
  );
}

function AssistantLabel({ mood, animated }: { mood: AvatarMood; animated: boolean }) {
  return (
    <div className="eyebrow flex items-center gap-2.5 text-xs tracking-[0.04em] text-[var(--muted)] sm:text-[13px]">
      <SkaffenAvatar mood={mood} animated={animated} />
      <span>
        {SITE.assistant.name} · {SITE.assistant.role}
      </span>
    </div>
  );
}

function AssistantMessage() {
  const message = useMessage();
  const isNew = useIsNewMessage();
  const hasContent = hasVisibleContent(message);
  const isWriting = message.status?.type === "running";
  const hasText = message.content.some((part) => part.type === "text" && part.text.trim().length > 0);
  const isLast = useMessage((state) => state.isLast);
  const isVisitorTyping = useThreadComposer((state) => state.text.trim().length > 0);
  const hasBrief = message.content.some((part) => part.type === "tool-call" && part.toolName === "showBrief");
  // A happy squint when a new reply arrives with the brief, then back to waiting.
  const isHappy = useHappyMoment(isLast && isNew && hasBrief && !isWriting);
  const mood: AvatarMood = isWriting
    ? "writing"
    : isHappy
      ? "happy"
      : isLast && isVisitorTyping
        ? "listening"
        : "idle";

  // An empty reply that is no longer running failed or was stopped: show nothing
  // here (RunErrorNotice shows the error) instead of an empty labelled reply.
  if (!hasContent && !isWriting) return null;

  return (
    <MessagePrimitive.Root className="w-full">
      <motion.div
        className="flex w-full flex-col gap-3"
        initial={isNew ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: isNew ? 0.15 : 0 }}
      >
        <AssistantLabel mood={mood} animated={isLast} />
        {hasContent ? (
          <div className="flex min-w-0 flex-col gap-4 text-base leading-[1.6] sm:text-lg">
            <MessagePrimitive.Parts
              components={{
                Text: MarkdownText,
              }}
            />
          </div>
        ) : isWriting ? (
          // The avatar looking up is the visual cue; this is for screen readers.
          <p className="sr-only">Writing a reply</p>
        ) : null}
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
        {hasText && !isWriting ? (
          <motion.div
            initial={isNew ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <MessageActions />
          </motion.div>
        ) : null}
      </motion.div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  const isNew = useIsNewMessage();

  return (
    <MessagePrimitive.Root className="flex w-full justify-end">
      <motion.div
        className="max-w-[85%] rounded-[1.4rem] bg-[var(--user-bubble)] px-[18px] py-3 text-base leading-[1.55] sm:max-w-[560px] sm:rounded-[1.5rem] sm:px-[22px] sm:py-3.5 sm:text-lg"
        initial={isNew ? { opacity: 0, y: 48 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <MessagePrimitive.Parts
          components={{
            Text: UserText,
          }}
        />
      </motion.div>
    </MessagePrimitive.Root>
  );
}

// Cycles the landing example until the visitor focuses the composer or types.
function useRotatingExample(enabled: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setIndex((value) => value + 1), 4500);
    return () => window.clearInterval(timer);
  }, [enabled]);
  return PROMPT_EXAMPLES[index % PROMPT_EXAMPLES.length];
}

function Composer({
  variant,
  onCancel,
}: {
  variant: "landing" | "dock";
  onCancel: () => void;
}) {
  const composerRuntime = useComposerRuntime();
  const isRunning = useThread((state) => state.isRunning);
  const charCount = useComposer((state) => state.text.length);
  const isBlank = useComposer((state) => state.text.trim().length === 0);
  const [hasFocused, setHasFocused] = useState(false);
  const isLanding = variant === "landing";
  const example = useRotatingExample(isLanding && !hasFocused && charCount === 0);
  const wasRunningRef = useRef(false);
  const charCounterId = useId();

  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      // Dismiss mobile keyboard once a message starts sending
      if (typeof document !== "undefined") {
        (document.activeElement as HTMLElement | null)?.blur();
      }
    }
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  // On the landing, sending an empty composer sends the example being shown.
  const sendExample = () => {
    composerRuntime.setText(example);
    composerRuntime.send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isLanding || !isBlank || isRunning) return;
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendExample();
    }
  };

  const buttonSize = isLanding ? "h-12 w-12 sm:h-14 sm:w-14" : "h-11 w-11 sm:h-12 sm:w-12";
  const buttonClass = `flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:opacity-85 disabled:opacity-40 ${buttonSize}`;
  const textClass = isLanding
    ? "min-h-12 py-2.5 text-base sm:min-h-14 sm:py-4 sm:text-xl"
    : "min-h-11 py-2.5 text-base sm:min-h-12 sm:text-lg";

  return (
    <ComposerPrimitive.Root>
      <motion.div
        layoutId="composer"
        layout="position"
        transition={composerLayoutTransition}
        className={`flex items-end gap-2 rounded-[1.75rem] border border-[var(--border-strong)] bg-[var(--surface)] sm:gap-3 ${
          isLanding
            ? "py-1.5 pl-5 pr-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:rounded-[2.25rem] sm:py-2.5 sm:pl-8 sm:pr-2.5 sm:shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
            : "py-1.5 pl-5 pr-1.5 sm:py-2 sm:pl-7 sm:pr-2"
        }`}
      >
        <div className="relative flex flex-1 self-center">
          <ComposerPrimitive.Input
            rows={1}
            unstable_focusOnScrollToBottom={false}
            unstable_focusOnRunStart={false}
            onFocus={() => setHasFocused(true)}
            onKeyDown={handleKeyDown}
            className={`max-h-[160px] w-full resize-none overflow-y-auto bg-transparent leading-6 outline-none placeholder:text-[var(--muted)] ${textClass}`}
            placeholder={isLanding ? "" : "Reply\u2026"}
            aria-label={isLanding ? "Tell me what you\u2019re working on" : "Reply"}
            maxLength={MAX_MESSAGE_CHARS}
            aria-describedby={charCount >= CHAR_COUNTER_FROM ? charCounterId : undefined}
          />
          {isLanding && charCount === 0 ? (
            // The example slides up and out as the next one slides in.
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 overflow-hidden leading-6 text-[var(--muted)] ${textClass}`}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={example}
                  className="block truncate"
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-120%", opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  Try &ldquo;{example}&rdquo;
                </motion.span>
              </AnimatePresence>
            </div>
          ) : null}
        </div>
        {isRunning ? (
          <ComposerPrimitive.Cancel
            onClick={onCancel}
            className={buttonClass}
            aria-label="Stop generating"
            data-cuelume-press="tick"
          >
            <Square size={16} fill="currentColor" />
          </ComposerPrimitive.Cancel>
        ) : isLanding && isBlank ? (
          <button
            type="button"
            onClick={sendExample}
            className={buttonClass}
            aria-label={`Ask \u201c${example}\u201d`}
            data-cuelume-press
          >
            <ArrowUp size={22} />
          </button>
        ) : (
          <ComposerPrimitive.Send className={buttonClass} aria-label="Send message" data-cuelume-press>
            <ArrowUp size={isLanding ? 22 : 20} />
          </ComposerPrimitive.Send>
        )}
      </motion.div>
      {charCount >= CHAR_COUNTER_FROM ? (
        <p
          id={charCounterId}
          className="mt-1.5 px-1 text-right text-[11px] leading-4 text-[var(--muted)]"
        >
          {charCount.toLocaleString()} / {MAX_MESSAGE_CHARS.toLocaleString()}
        </p>
      ) : null}
    </ComposerPrimitive.Root>
  );
}

// Saves messages when no run is streaming (so not on every token), and flushes
// unsaved messages when the page is hidden or closed and when the thread unmounts.
function ThreadPersistence({
  onMessagesChange,
}: {
  onMessagesChange: (messages: UIMessage[]) => void;
}) {
  const isRunning = useThread((state) => state.isRunning);
  const messages = useThread((state) => state.messages);
  const onMessagesChangeRef = useRef(onMessagesChange);
  const latestMessagesRef = useRef(messages);
  const savedMessagesRef = useRef<typeof messages | null>(null);

  // Keep callback ref up to date without triggering effect
  useEffect(() => {
    onMessagesChangeRef.current = onMessagesChange;
  });

  const flush = useCallback(() => {
    const current = latestMessagesRef.current;
    if (savedMessagesRef.current === current) return;
    savedMessagesRef.current = current;
    // Convert assistant-ui messages to UIMessage format
    onMessagesChangeRef.current(toUIMessages(current));
  }, []);

  useEffect(() => {
    latestMessagesRef.current = messages;
    if (!isRunning) flush();
  }, [isRunning, messages, flush]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flush();
    };
  }, [flush]);

  return null;
}


function MarkdownAnchor({
  href,
  children,
  node: _node,
  ...rest
}: ComponentPropsWithoutRef<"a"> & { node?: unknown }) {
  const external = typeof href === "string" && /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      {...rest}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

const markdownComponents = { a: MarkdownAnchor };

function MarkdownText() {
  return (
    <MarkdownTextPrimitive
      className="message-markdown"
      components={markdownComponents}
    />
  );
}

function UserText() {
  return <MessagePartPrimitive.Text className="whitespace-pre-wrap leading-6" />;
}
