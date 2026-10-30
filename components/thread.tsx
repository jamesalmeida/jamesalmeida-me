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
  useMessagePartText,
  useThread,
  useThreadComposer,
  type ThreadMessage,
  useThreadViewport,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useHappyMoment, type AvatarConfig, type AvatarMood } from "@jamesalmeida/agent-avatars";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { play } from "cuelume";
import { ArrowDown, ArrowUp, Lock, Square } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { SITE } from "@/data/site";
import { threadIsClosed } from "@/lib/jev-decision";
import { toUIMessages } from "@/lib/message-convert";
import { getVisitContext, getVisitId, trackEvent } from "@/lib/visit";
import { serif } from "./booking-button";
import { LandingHeadline } from "./landing-headline";
import { useLanding } from "./landing-settings";
import { MessageActions } from "./message-actions";
import { useMotion } from "./motion-settings";
import { usePacedText } from "./paced-text";
import { BouncingDots } from "./bouncing-dots";
import { SkaffenAvatar } from "./playful-avatar";
import { PrivacyNotice } from "./privacy-notice";
import { ShowBookingCtaToolUI, ShowBriefToolUI } from "./tool-cards";

type ThreadProps = {
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
  onReply?: (text: string) => void;
  onRunComplete?: (messages: UIMessage[]) => void;
  /** Skaffen's look (the site setting); shown above the latest reply. */
  avatar?: AvatarConfig;
  /** True once the thread has messages: ChatApp hides the header avatar then. */
  onConversationChange?: (isConversation: boolean) => void;
};

// Skaffen's look for the reply avatar, from ChatApp (the saved site setting).
const SkaffenAvatarContext = createContext<AvatarConfig>(SITE.assistant.avatar);

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

// Created once: a new transport per render is wasted work. Each request also carries
// the conversation id (the chat's first message id, stable when the new chat forks
// into history) and the visit, for the stored transcript (lib/visit.ts).
const chatTransport = new DefaultChatTransport({
  api: "/api/chat",
  fetch: chatFetch,
  prepareSendMessagesRequest: ({ id, messages, body, trigger, messageId }) => ({
    body: {
      ...body,
      id,
      messages,
      trigger,
      messageId,
      conversationId: messages[0]?.id,
      visitId: getVisitId(),
      context: getVisitContext(),
    },
  }),
});

// Ids of the messages the thread mounted with. Only messages sent or received after
// that animate in, so a restored chat doesn't replay its whole history.
const InitialMessageIdsContext = createContext<ReadonlySet<string>>(new Set());

function useIsNewMessage() {
  const initialIds = useContext(InitialMessageIdsContext);
  const id = useMessage((message) => message.id);
  return !initialIds.has(id);
}

// While the phone keyboard opens or closes, the visual viewport resizes for a few
// hundred milliseconds. Re-run `scroll` after each resize for `ms`, two frames later
// so the layout and assistant-ui's turn-anchor measurements have caught up.
function followKeyboard(scroll: () => void, ms = 1000) {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const onResize = () => requestAnimationFrame(() => requestAnimationFrame(scroll));
  viewport.addEventListener("resize", onResize);
  window.setTimeout(() => viewport.removeEventListener("resize", onResize), ms);
}

// The message viewport, so the composer can glide it when a message is sent.
const ViewportRefContext = createContext<RefObject<HTMLDivElement | null>>({ current: null });

const glides = new WeakMap<HTMLElement, () => void>();

// Scrolls the viewport to the bottom over `ms`, easing in and out, so the previous
// messages visibly move up instead of jumping away. The target is read every frame,
// because the reply's room and the phone keyboard change it on the way. A call while
// it's gliding lets it carry on. The visitor scrolling stops it. Instant with
// reduced motion.
function glideToBottom(element: HTMLElement | null, ms: number) {
  if (!element || glides.has(element)) return;
  if (ms <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.scrollTop = element.scrollHeight;
    return;
  }
  const from = element.scrollTop;
  const start = performance.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    glides.delete(element);
    element.removeEventListener("wheel", stop);
    element.removeEventListener("touchstart", stop);
  };
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    const target = element.scrollHeight - element.clientHeight;
    element.scrollTop = from + (target - from) * eased;
    if (t < 1) frame = requestAnimationFrame(tick);
    else stop();
  };
  glides.set(element, stop);
  element.addEventListener("wheel", stop, { passive: true });
  element.addEventListener("touchstart", stop, { passive: true });
  frame = requestAnimationFrame(tick);
}


export function Thread({
  avatar = SITE.assistant.avatar,
  initialMessages,
  onConversationChange,
  onMessagesChange,
  onReply,
  onRunComplete,
}: ThreadProps) {
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
      <SkaffenAvatarContext.Provider value={avatar}>
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
        <ThreadBody
          runError={runError}
          onCancel={() => { cancelledRef.current = true; }}
          onConversationChange={onConversationChange}
        />
      </ThreadPrimitive.Root>
      </SkaffenAvatarContext.Provider>
      </InitialMessageIdsContext.Provider>
    </AssistantRuntimeProvider>
  );
}

// The landing (a question and a big composer) until the first message, then the
// conversation with the composer floating at the bottom. On the first send the
// landing fades up and away while the composer glides down.
function ThreadBody({
  onCancel,
  onConversationChange,
  runError,
}: {
  onCancel: () => void;
  onConversationChange?: (isConversation: boolean) => void;
  runError: string | null;
}) {
  const isEmpty = useThread((state) => state.messages.length === 0);
  const landingExitSeconds = useMotion().seconds(0.45);
  const viewportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-h-0 flex-1">
      <AnimatePresence initial={false}>
        {isEmpty ? (
          <motion.div
            key="landing"
            className="absolute inset-0 flex flex-col overflow-y-auto"
            exit={{ opacity: 0, y: -32, pointerEvents: "none" }}
            transition={{ duration: landingExitSeconds, ease: "easeOut" }}
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 pb-16 pt-4 sm:gap-7 sm:px-12 sm:pb-20">
              <LandingTitle />
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
        <ViewportRefContext.Provider value={viewportRef}>
          <h1 className="sr-only">Chat with {SITE.assistant.name}, {SITE.assistant.role}</h1>
          <ConversationPresence onConversationChange={onConversationChange} />
          <KeepAnchorOnRunEnd />
          {/* turnAnchor="top": each new message scrolls to the top of the viewport and
              the reply streams in below it (MessagePrimitive.Root adds the room for it).
              The Composer glides it there (glideToBottom), so assistant-ui's instant
              scroll on run start is off.
              Spacing is padding on each message, not a flex gap, so the anchored
              message's measured height includes it. The composer is a sticky footer,
              so messages slide behind it, and its height counts too. The message
              column grows to push the footer down; don't use mt-auto on a footer,
              because assistant-ui counts a footer's top margin in its height. */}
          <ThreadPrimitive.Viewport
            ref={viewportRef}
            turnAnchor="top"
            scrollToBottomOnRunStart={false}
            className="absolute inset-0 flex flex-col overflow-y-auto"
          >
            <div className="mx-auto flex w-full max-w-[760px] shrink-0 grow flex-col px-4 sm:box-content sm:px-12">
              <ThreadPrimitive.Messages
                components={{
                  AssistantMessage: AssistantMessage,
                  UserMessage: UserMessage,
                }}
              />
              <RunErrorNotice error={runError} />
            </div>
            <ThreadPrimitive.ViewportFooter className="sticky bottom-0 shrink-0 bg-[linear-gradient(to_bottom,transparent,var(--background)_45%)] px-4 pb-2 pt-3 sm:px-12 sm:pb-6">
              <div className="relative mx-auto w-full max-w-[780px]">
                <ScrollToBottomButton />
                <Composer variant="dock" onCancel={onCancel} />
                {/* Under the composer on desktop only; phones keep the space for messages. */}
                <div className="hidden sm:block">
                  <PrivacyNotice className="mt-2.5" />
                </div>
              </div>
            </ThreadPrimitive.ViewportFooter>
          </ThreadPrimitive.Viewport>
          {/* Messages fade out under the header, like they do into the composer. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-7 bg-[linear-gradient(to_bottom,var(--background),transparent)]"
          />
        </ViewportRefContext.Provider>
      )}
    </div>
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

// When a reply finishes, assistant-ui swaps the streamed message for the final one.
// For a moment the room it keeps below the reply (turnAnchor="top") is gone, so the
// browser clamps the scroll position and the chat jumps up. If the visitor was still
// anchored at the bottom when the run ended, put them back once the layout settles.
function KeepAnchorOnRunEnd() {
  const isRunning = useThread((state) => state.isRunning);
  const isAtBottom = useThreadViewport((state) => state.isAtBottom);
  const scrollToBottom = useThreadViewport((state) => state.scrollToBottom);
  const wasRunningRef = useRef(isRunning);
  const wasAtBottomRef = useRef(isAtBottom);

  useEffect(() => {
    const justFinished = wasRunningRef.current && !isRunning;
    wasRunningRef.current = isRunning;
    if (justFinished && wasAtBottomRef.current) {
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => scrollToBottom({ behavior: "auto" }));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
  }, [isRunning, scrollToBottom]);

  // Read in the effect above: the value from before the run ended, not after the jump.
  useEffect(() => {
    if (isRunning) wasAtBottomRef.current = isAtBottom;
  }, [isRunning, isAtBottom]);

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
          className="absolute -top-12 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
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

// A visitor message that thanks Skaffen: its reply gets a heart-eyed moment.
const THANKS = /\b(thanks|thank you|thank u|thx|cheers|much appreciated|appreciate it)\b/i;

function isThanks(message: ThreadMessage | undefined) {
  if (message?.role !== "user") return false;
  return message.content.some((part) => part.type === "text" && THANKS.test(part.text));
}

// Shows the last run's error under the last user message when the run failed
// before the assistant produced any content. Errors after some content show
// inside the assistant message (MessagePrimitive.Error).
// No reply shows then, so Skaffen (looking sorry) sits above the error instead.
function RunErrorNotice({ error }: { error: string | null }) {
  const avatar = useContext(SkaffenAvatarContext);
  const isRunning = useThread((state) => state.isRunning);
  const last = useThread((state) => state.messages[state.messages.length - 1]);
  if (!error || isRunning || !last) return null;
  if (last.role === "assistant" && hasVisibleContent(last)) return null;

  return (
    <div className="mt-7 flex flex-col items-start gap-3">
      <SkaffenAvatar avatar={avatar} mood="sorry" />
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    </div>
  );
}

// Mounted while the thread has messages: tells ChatApp a conversation is on screen,
// so the header avatar shrinks away (Skaffen shows above the latest reply instead).
function ConversationPresence({ onConversationChange }: { onConversationChange?: (isConversation: boolean) => void }) {
  useEffect(() => {
    onConversationChange?.(true);
    return () => onConversationChange?.(false);
  }, [onConversationChange]);
  return null;
}

// When each new reply may show, keyed by the visitor message it answers (parentId).
// Module-level, because a quick first reply forks the new chat into history and
// remounts the thread while Skaffen should still be thinking.
const thinkingUntil = new Map<string, number>();

// Holds a new reply back for the site's minimum thinking time, so Skaffen's thinking
// is visible even when the reply is ready at once. `held` is true until then;
// `wasHeld` says the reply was held recently, so it fades in when it shows (also
// after a remount). Restored replies skip it.
function useThinkingHold(isNew: boolean) {
  const { minThinkingMs } = useMotion();
  const key = useMessage((message) => message.parentId);
  const [until] = useState(() => {
    if (!key) return undefined;
    if (!thinkingUntil.has(key) && isNew && minThinkingMs > 0) thinkingUntil.set(key, Date.now() + minThinkingMs);
    return thinkingUntil.get(key);
  });
  const [held, setHeld] = useState(() => until !== undefined && until > Date.now());
  useEffect(() => {
    if (!held || until === undefined) return;
    const timer = window.setTimeout(() => setHeld(false), Math.max(0, until - Date.now()));
    return () => window.clearTimeout(timer);
  }, [held, until]);
  return { held, wasHeld: until !== undefined && Date.now() - until < 5000 };
}

// Skaffen above the latest reply, as its status: thinking from the moment a message
// is sent until the reply shows (at least the minimum thinking time), writing while
// it streams, a heart-eyed moment when it answers a thank-you, a happy moment when
// a new reply brings the brief, listening while the visitor types, sorry when the
// reply failed partway, otherwise idle. Beside it, "Thinking…" / "Writing…" and then
// "James' AI assistant". It pops in under each new
// message and shrinks away from the previous reply. Tapping it is the PlayfulAvatar
// easter egg.
function ReplyAvatar({ isNew, isRevealing, isThinking }: { isNew: boolean; isRevealing: boolean; isThinking: boolean }) {
  const avatar = useContext(SkaffenAvatarContext);
  const { spring, seconds } = useMotion();
  const isRunning = useMessage((message) => message.status?.type === "running");
  const hasContent = useMessage(hasVisibleContent);
  const bringsBrief = useMessage((message) =>
    message.content.some((part) => part.type === "tool-call" && part.toolName === "showBrief"),
  );
  const failed = useMessage((message) => message.status?.type === "incomplete" && message.status.reason === "error");
  const messageId = useMessage((message) => message.id);
  const answersThanks = useThread((state) => {
    const index = state.messages.findIndex((message) => message.id === messageId);
    return index > 0 && isThanks(state.messages[index - 1]);
  });
  const isVisitorTyping = useThreadComposer((state) => state.text.trim().length > 0);
  // Writing while the reply streams and until its text has all appeared.
  const isWriting = isRunning || isRevealing;
  const isLoved = useHappyMoment(isNew && answersThanks && !isWriting);
  const isHappy = useHappyMoment(isNew && bringsBrief && !isWriting);
  const mood: AvatarMood = isThinking || (isRunning && !hasContent)
    ? "thinking"
    : isWriting
      ? "writing"
      : isLoved
        ? "love"
        : isHappy
          ? "happy"
          : isVisitorTyping
            ? "listening"
            : failed
              ? "sorry"
              : "idle";
  const status = mood === "thinking" ? "Thinking" : mood === "writing" ? "Writing" : SITE.assistant.role;
  const isWorking = mood === "thinking" || mood === "writing";

  return (
    <motion.div
      className="flex origin-left items-center gap-3"
      initial={isNew ? { scale: 0, opacity: 0, height: 0 } : false}
      animate={{ scale: 1, opacity: 1, height: "auto" }}
      exit={{ scale: 0, opacity: 0, height: 0 }}
      transition={isNew ? { ...spring(0.8, 0.3), delay: seconds(0.25) } : spring(0.6, 0.1)}
    >
      <SkaffenAvatar avatar={avatar} mood={mood === "writing" ? "idle" : mood} speaking={mood === "writing"} />
      {/* Its status, a little dimmer than the reply: what it's doing while it works,
          then who it is. Hidden from screen readers: the sr-only heading says who's
          talking and "Writing a reply" covers the wait. */}
      <span aria-hidden className="relative text-base leading-[1.6] text-[var(--muted)] sm:text-lg">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={status}
            className="block whitespace-nowrap"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: seconds(0.3), ease: "easeOut" }}
          >
            {status}
            {isWorking ? <BouncingDots duration={seconds(1.2)} /> : null}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.div>
  );
}

function AssistantMessage() {
  const message = useMessage();
  const isNew = useIsNewMessage();
  const isLast = useMessage((state) => state.isLast);
  const { seconds } = useMotion();
  const { held: isHeld, wasHeld } = useThinkingHold(isNew);
  const hasContent = hasVisibleContent(message);
  const isWriting = message.status?.type === "running";
  const hasText = message.content.some((part) => part.type === "text" && part.text.trim().length > 0);
  // Text parts still appearing (MarkdownText paces them), by part index.
  const [revealing, setRevealing] = useState<ReadonlySet<number>>(() => new Set());
  const reportRevealing = useCallback((index: number, on: boolean) => {
    setRevealing((current) => {
      if (current.has(index) === on) return current;
      const next = new Set(current);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });
  }, []);
  const isRevealing = revealing.size > 0;

  // An empty reply that is no longer running failed or was stopped: show nothing
  // here (RunErrorNotice shows the error) instead of an empty reply.
  if (!hasContent && !isWriting) return null;

  return (
    <MessagePrimitive.Root className="w-full pt-7">
      <motion.div
        className="flex w-full flex-col gap-3"
        initial={isNew ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: seconds(0.5), ease: "easeOut", delay: isNew ? seconds(0.2) : 0 }}
      >
        <h2 className="sr-only">{SITE.assistant.role} said:</h2>
        {/* Only the latest reply has Skaffen above it. */}
        <AnimatePresence initial={false}>
          {isLast ? <ReplyAvatar key="avatar" isNew={isNew} isRevealing={isRevealing} isThinking={isHeld} /> : null}
        </AnimatePresence>
        {hasContent && !isHeld ? (
          <motion.div
            className="flex min-w-0 flex-col gap-4 text-base leading-[1.6] sm:text-lg"
            initial={isNew || wasHeld ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: seconds(0.5), ease: "easeOut" }}
          >
            <RevealContext.Provider value={reportRevealing}>
              <MessagePrimitive.Parts
                components={{
                  Text: MarkdownText,
                }}
              />
            </RevealContext.Provider>
          </motion.div>
        ) : isWriting || isHeld ? (
          // Skaffen's thinking avatar above is the visual cue; this is for screen readers.
          <p className="sr-only">Writing a reply</p>
        ) : null}
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
        {hasText && !isWriting && !isRevealing && !isHeld ? (
          <motion.div
            initial={isNew || wasHeld ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: seconds(0.35), ease: "easeOut" }}
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
  const { spring } = useMotion();

  return (
    <MessagePrimitive.Root className="flex w-full justify-end pt-7">
      <motion.div
        className="max-w-[85%] rounded-[1.4rem] bg-[var(--user-bubble)] px-[18px] py-3 text-base leading-[1.55] sm:max-w-[560px] sm:rounded-[1.5rem] sm:px-[22px] sm:py-3.5 sm:text-lg"
        initial={isNew ? { opacity: 0, y: 48 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={spring(0.7, 0.15)}
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

// The landing h1: this visit's headline. While headlines are A/B tested it fades in,
// since StaticIntro kept its own (maybe different) h1 invisible.
function LandingTitle() {
  const { headline, headlines } = useLanding();
  const isTesting = headlines.filter((option) => option.active).length > 1;
  return (
    <h1
      className={`max-w-[1000px] text-center text-[44px] font-normal leading-[1.05] tracking-[-0.02em] sm:text-[72px] lg:text-[88px] lg:leading-[1.02] ${serif} ${isTesting ? "landing-fade-in" : ""}`}
    >
      <LandingHeadline text={headline} />
    </h1>
  );
}

// Cycles the landing examples (Settings → Landing in /admin) until the visitor
// focuses the composer or types. Starts at a random one, so no example wins the
// "which gets sent" count just by being shown first.
function useRotatingExample(enabled: boolean) {
  const { examples, exampleIntervalMs } = useLanding();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * examples.length));
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => setIndex((value) => value + 1), exampleIntervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, exampleIntervalMs]);
  return examples[index % examples.length];
}

function useChatClosed() {
  return useThread((state) => threadIsClosed(state.messages));
}

function Composer({
  variant,
  onCancel,
}: {
  variant: "landing" | "dock";
  onCancel: () => void;
}) {
  const composerRuntime = useComposerRuntime();
  const closed = useChatClosed();
  const isRunning = useThread((state) => state.isRunning);
  const charCount = useComposer((state) => state.text.length);
  const isBlank = useComposer((state) => state.text.trim().length === 0);
  const [hasFocused, setHasFocused] = useState(false);
  const isLanding = variant === "landing";
  const example = useRotatingExample(isLanding && !hasFocused && charCount === 0);
  const wasRunningRef = useRef(false);
  const charCounterId = useId();
  const scrollToBottom = useThreadViewport((state) => state.scrollToBottom);
  const viewportRef = useContext(ViewportRefContext);
  const glideMs = useMotion().seconds(1.4) * 1000;

  // Focusing the docked composer opens the phone keyboard, which shrinks the
  // viewport. Jump to the latest message, and follow the resize while the
  // keyboard animates in, so the scroll-to-latest button doesn't show while typing.
  const handleFocus = () => {
    setHasFocused(true);
    if (isLanding) return;
    scrollToBottom({ behavior: "auto" });
    followKeyboard(() => scrollToBottom({ behavior: "auto" }));
  };

  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      // Once a message starts sending, glide it up to the top of the viewport
      // (slowly, so the earlier messages are seen moving up) and dismiss the phone
      // keyboard. The viewport grows as the keyboard closes; the glide follows it.
      const glide = () => glideToBottom(viewportRef.current, glideMs);
      requestAnimationFrame(glide);
      if (typeof document !== "undefined") {
        (document.activeElement as HTMLElement | null)?.blur();
        followKeyboard(glide);
      }
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, viewportRef, glideMs]);

  // On the landing, sending an empty composer sends the example being shown. The
  // admin dashboard counts which examples get people started.
  const sendExample = () => {
    trackEvent("example_sent", undefined, example);
    composerRuntime.setText(example);
    composerRuntime.send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (closed || !isLanding || !isBlank || isRunning) return;
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      sendExample();
    }
  };

  const motionSettings = useMotion();
  const buttonSize = isLanding ? "h-12 w-12 sm:h-14 sm:w-14" : "h-11 w-11 sm:h-12 sm:w-12";
  const buttonClass = `flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:opacity-85 disabled:opacity-40 ${buttonSize}`;
  const textClass = isLanding
    ? "min-h-12 py-2.5 text-base sm:min-h-14 sm:py-4 sm:text-xl"
    : "min-h-11 py-2.5 text-base sm:min-h-12 sm:text-lg";

  const closedNoteId = useId();
  const keepClosed = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <ComposerPrimitive.Root onSubmit={closed ? keepClosed : undefined}>
      <motion.div
        layoutId="composer"
        layout="position"
        // The composer glides from the landing to the dock (shared layout animation).
        transition={motionSettings.spring(0.8, 0.12)}
        className={`flex items-end gap-2 rounded-[1.75rem] border border-[var(--border-strong)] bg-[var(--surface)] sm:gap-3 ${
          isLanding
            ? "py-1.5 pl-5 pr-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:rounded-[2.25rem] sm:py-2.5 sm:pl-8 sm:pr-2.5 sm:shadow-[0_24px_80px_rgba(0,0,0,0.08)]"
            : // Half its single-line height on desktop (8 + 48 + 8 px + borders), so the ends are round.
              "py-1.5 pl-5 pr-1.5 sm:rounded-[2.125rem] sm:py-2 sm:pl-7 sm:pr-2"
        }`}
      >
        <div className="relative flex flex-1 self-center">
          <ComposerPrimitive.Input
            rows={1}
            unstable_focusOnScrollToBottom={false}
            unstable_focusOnRunStart={false}
            disabled={closed}
            submitOnEnter={!closed}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className={`max-h-[160px] w-full resize-none overflow-y-auto bg-transparent leading-6 outline-none placeholder:text-[var(--muted)] disabled:cursor-not-allowed disabled:text-[var(--muted)] ${textClass}`}
            placeholder={closed ? "This chat is closed" : isLanding ? "" : "Reply\u2026"}
            aria-label={closed ? "This chat is closed" : isLanding ? "Tell me what you\u2019re working on" : "Reply"}
            maxLength={MAX_MESSAGE_CHARS}
            aria-describedby={closed ? closedNoteId : charCount >= CHAR_COUNTER_FROM ? charCounterId : undefined}
          />
          {isLanding && charCount === 0 && !closed ? (
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
        {closed ? (
          <span className={`${buttonClass} cursor-not-allowed`} aria-hidden>
            <Lock size={isLanding ? 20 : 18} />
          </span>
        ) : isRunning ? (
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
      {closed ? (
        <p id={closedNoteId} className="mt-2 px-1 text-center text-sm text-[var(--muted)]">
          This chat is closed.
        </p>
      ) : null}
      {!closed && charCount >= CHAR_COUNTER_FROM ? (
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

// Tells the reply which of its text parts are still appearing.
const RevealContext = createContext<(index: number, revealing: boolean) => void>(() => {});

// A reply's text, appearing at the site's text speed (Settings → Motion): a new
// reply from its first character, a restored one all at once. assistant-ui's own
// smoothing is off; `preprocess` swaps in the part shown so far.
function MarkdownText() {
  const { text } = useMessagePartText();
  const { textCharsPerSecond } = useMotion();
  const isNew = useIsNewMessage();
  const parentId = useMessage((message) => message.parentId);
  const index = useMessage((message) =>
    Math.max(0, message.content.findIndex((part) => part.type === "text" && part.text.startsWith(text))),
  );
  const paced = usePacedText(text, textCharsPerSecond, {
    from: isNew ? 0 : text.length,
    key: parentId ? `${parentId}:${index}` : null,
  });
  const report = useContext(RevealContext);
  useLayoutEffect(() => report(index, !paced.done), [report, index, paced.done]);
  useLayoutEffect(() => () => report(index, false), [report, index]);
  const preprocess = useCallback(() => paced.text, [paced.text]);

  return (
    <MarkdownTextPrimitive
      className="message-markdown"
      components={markdownComponents}
      smooth={false}
      preprocess={preprocess}
    />
  );
}

function UserText() {
  return <MessagePartPrimitive.Text className="whitespace-pre-wrap leading-6" />;
}
