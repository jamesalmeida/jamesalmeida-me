"use client";

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  MessagePartPrimitive,
  ThreadPrimitive,
  useMessage,
  useThread,
  useThreadRuntime,
  useThreadViewport,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { play } from "cuelume";
import { ArrowDown, ArrowUp, CalendarCheck, MoreHorizontal, Pencil, RotateCcw, Square, Trash2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from "react";
import { SITE } from "@/data/site";
import { toUIMessages } from "@/lib/message-convert";
import type { PortfolioThread } from "@/lib/threads";
import { Modal } from "./modal";
import { Suggestions } from "./suggestions";
import { useTheme } from "./theme-provider";
import { ShowBookingCtaToolUI, ShowPortfolioToolUI } from "./tool-cards";

type ThreadProps = {
  initialMessages: UIMessage[];
  onDeleteThread?: () => void;
  onMessagesChange: (messages: UIMessage[]) => void;
  onRenameThread?: (title: string) => void;
  onRestart?: (messages: UIMessage[]) => void;
  onRunComplete?: (messages: UIMessage[]) => void;
  thread: PortfolioThread;
};

const BLOCKED_MESSAGE =
  "You're sending messages too fast. Please wait a minute and try again, or email james@gsv.to.";

// The transport shows the raw response body as the error, so replace rate-limit (429)
// and bot-check (403) responses with a short friendly message.
const chatFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status === 429 || response.status === 403) {
    throw new Error(BLOCKED_MESSAGE);
  }
  return response;
};

export function Thread({
  initialMessages,
  onDeleteThread,
  onMessagesChange,
  onRenameThread,
  onRestart,
  onRunComplete,
  thread,
}: ThreadProps) {
  const runtime = useChatRuntime({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat", fetch: chatFetch }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ShowBookingCtaToolUI />
      <ShowPortfolioToolUI />
      <ThreadPersistence onMessagesChange={onMessagesChange} />
      <RunCompleteDetector onRunComplete={onRunComplete} />
      <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
        <Header thread={thread} onDeleteThread={onDeleteThread} onRenameThread={onRenameThread} onRestart={onRestart} />

        <div className="relative min-h-0 flex-1">
          <AutoScrollViewport>
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              <ThreadPrimitive.Empty>
                <Suggestions threadId={thread.id} />
              </ThreadPrimitive.Empty>
              <ThreadPrimitive.Messages
                components={{
                  AssistantMessage: AssistantMessage,
                  UserMessage: UserMessage,
                }}
              />
            </div>
          </AutoScrollViewport>
          <ScrollToBottomButton />
        </div>

        <Composer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

// Fires onRunComplete once after the first AI response in this Thread instance.
// Used to auto-fork static threads into history once the first exchange completes.
function RunCompleteDetector({
  onRunComplete,
}: {
  onRunComplete?: (messages: UIMessage[]) => void;
}) {
  const isRunning = useThread((state) => state.isRunning);
  const messages = useThread((state) => state.messages);
  const prevRunning = useRef(false);
  const hasFired = useRef(false);

  useEffect(() => {
    const justFinished = prevRunning.current && !isRunning;
    prevRunning.current = isRunning;

    if (!justFinished || messages.length === 0) return;

    play("ready");

    if (hasFired.current || !onRunComplete) return;
    hasFired.current = true;
    onRunComplete(toUIMessages(messages));
  }, [isRunning, messages, onRunComplete]);

  return null;
}

function getMenuItems(menu: HTMLElement | null) {
  return Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

function Header({
  thread,
  onDeleteThread,
  onRenameThread,
  onRestart,
}: {
  thread: PortfolioThread;
  onDeleteThread?: () => void;
  onRenameThread?: (title: string) => void;
  onRestart?: (messages: UIMessage[]) => void;
}) {
  const runtime = useThreadRuntime();
  const messages = useThread((state) => state.messages);
  const hasMessages = messages.length > 0;
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const menuId = useId();
  const menuButtonId = useId();
  const renameTitleId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  // Which item to focus when the menu opens: arrow-up on the trigger picks the last.
  const focusLastOnOpen = useRef(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const items = getMenuItems(menuRef.current);
    (focusLastOnOpen.current ? items[items.length - 1] : items[0])?.focus();
    focusLastOnOpen.current = false;
  }, [isMenuOpen]);

  const closeMenu = (returnFocus: boolean) => {
    setIsMenuOpen(false);
    if (returnFocus) menuButtonRef.current?.focus();
  };

  const handleMenuButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      focusLastOnOpen.current = e.key === "ArrowUp";
      setIsMenuOpen(true);
    }
  };

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = getMenuItems(menuRef.current);
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    switch (e.key) {
      case "ArrowDown":
        next = items[(index + 1) % items.length];
        break;
      case "ArrowUp":
        next = items[(index - 1 + items.length) % items.length];
        break;
      case "Home":
        next = items[0];
        break;
      case "End":
        next = items[items.length - 1];
        break;
      case "Escape":
      case "Tab":
        e.preventDefault();
        closeMenu(true);
        return;
      default:
        return;
    }
    e.preventDefault();
    next?.focus();
  };

  const handleRestart = () => {
    play("tick");
    if (onRestart && messages.length > 0) {
      onRestart(toUIMessages(messages));
    }
    runtime.reset();
  };

  const openRename = () => {
    setRenameValue(thread.title);
    setIsRenaming(true);
    setIsMenuOpen(false);
  };

  const saveRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && onRenameThread) {
      onRenameThread(trimmed);
      play("success");
    }
    setIsRenaming(false);
  };

  // Inline styles for iOS Safari compatibility
  const bgColor = theme === "dark" ? "rgba(23, 23, 23, 0.72)" : "rgba(255, 255, 255, 0.72)";
  const btnBg = theme === "dark" ? "rgba(23, 23, 23, 0.9)" : "rgba(255, 255, 255, 0.9)";
  const menuBg = theme === "dark" ? "rgba(28, 28, 28, 0.98)" : "rgba(255, 255, 255, 0.98)";

  return (
    <>
      <header
        className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 sm:px-6 sm:py-4 lg:justify-between"
        style={{ backgroundColor: bgColor }}
      >
        <div className="h-10 w-10 flex-shrink-0 lg:hidden" aria-hidden />
        <div className="min-w-0 flex-1 text-center lg:flex-initial lg:text-left">
          <p className="eyebrow text-[10px] text-[var(--muted)] sm:text-xs">James Almeida</p>
          <h2 className="truncate font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-lg tracking-[-0.03em] sm:text-2xl">
            {thread.title}
          </h2>
          <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-[var(--muted)] lg:block">
            {thread.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={SITE.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-2 text-xs font-medium text-[var(--accent-foreground)] transition hover:opacity-90 lg:px-4 lg:text-sm"
            aria-label={SITE.bookingLabel}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            <CalendarCheck size={15} />
            <span className="lg:hidden">{SITE.bookingShortLabel}</span>
            <span className="hidden lg:inline">{SITE.bookingLabel}</span>
          </a>

        {onDeleteThread ? (
          <div className="relative flex-shrink-0">
            <button
              ref={menuButtonRef}
              id={menuButtonId}
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              onKeyDown={handleMenuButtonKeyDown}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls={isMenuOpen ? menuId : undefined}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              style={{ backgroundColor: btnBg }}
              aria-label="Thread options"
              title="Options"
              data-cuelume-toggle
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <>
                {/* Mouse-only click-outside layer; keyboard users close with Escape or Tab. */}
                <div
                  className="fixed inset-0 z-40"
                  aria-hidden="true"
                  onClick={() => closeMenu(false)}
                />
                <div
                  ref={menuRef}
                  id={menuId}
                  role="menu"
                  aria-labelledby={menuButtonId}
                  onKeyDown={handleMenuKeyDown}
                  className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-[1rem] border border-[var(--border)] shadow-[0_16px_40px_rgba(0,0,0,0.14)]"
                  style={{ backgroundColor: menuBg }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={openRename}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-[var(--panel)] focus-visible:bg-[var(--panel)]"
                  >
                    <Pencil size={14} className="text-[var(--muted)]" />
                    Rename
                  </button>
                  <div role="separator" className="mx-3 border-t border-[var(--border)]" />
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      setIsMenuOpen(false);
                      play("whisper");
                      onDeleteThread();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 transition hover:bg-[var(--panel)] focus-visible:bg-[var(--panel)]"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ) : hasMessages ? (
          <button
            onClick={handleRestart}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
            style={{ backgroundColor: btnBg }}
            aria-label="Restart conversation"
            title="Restart"
          >
            <RotateCcw size={16} />
          </button>
        ) : null}
        </div>
      </header>

      {isRenaming && (
        <Modal
          labelledBy={renameTitleId}
          onClose={() => setIsRenaming(false)}
          initialFocusRef={renameInputRef}
          returnFocusRef={menuButtonRef}
        >
          {/* A form so Enter saves on implicit submit, while focus is still in the input. */}
          <form
            className="relative w-full max-w-sm rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            onSubmit={(e) => {
              e.preventDefault();
              saveRename();
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                id={renameTitleId}
                className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-[-0.02em]"
              >
                Rename
              </h2>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                onClick={() => setIsRenaming(false)}
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
            <input
              ref={renameInputRef}
              type="text"
              aria-label="Thread title"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-5 w-full rounded-[0.75rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--border-strong)]"
              placeholder="Thread title"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-foreground)] transition hover:opacity-85"
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// Only auto-scroll once a conversation exists, so tall empty states (e.g. the
// Work with me pills + booking card) start at the top instead of the bottom.
function AutoScrollViewport({ children }: { children: React.ReactNode }) {
  const hasMessages = useThread((state) => state.messages.length > 0);
  return (
    <ThreadPrimitive.Viewport
      autoScroll={hasMessages}
      className="absolute inset-0 overflow-y-auto px-4 pb-6 pt-6 sm:px-6"
    >
      {children}
    </ThreadPrimitive.Viewport>
  );
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

function AssistantMessage() {
  const message = useMessage();
  const hasText = message.content.some(
    (part) => part.type === "text" && part.text.length > 0,
  );
  const hasTool = message.content.some((part) => part.type === "tool-call");

  if (!hasText && !hasTool) {
    return (
      <MessagePrimitive.Root className="flex w-full justify-start">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
          </div>
        </div>
      </MessagePrimitive.Root>
    );
  }

  return (
    <MessagePrimitive.Root className="flex w-full justify-start">
      <div className={`min-w-0 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)] ${hasTool ? "w-full max-w-3xl" : "max-w-[85%] sm:max-w-3xl"}`}>
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownText,
          }}
        />
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
      </div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end">
      <div className="max-w-[85%] rounded-[1.5rem] bg-[var(--accent)] px-5 py-4 text-[var(--accent-foreground)] shadow-[0_16px_40px_rgba(0,0,0,0.14)] sm:max-w-2xl">
        <MessagePrimitive.Parts
          components={{
            Text: UserText,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  const isRunning = useThread((state) => state.isRunning);
  const { theme } = useTheme();
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      // Dismiss mobile keyboard once a message starts sending
      if (typeof document !== "undefined") {
        (document.activeElement as HTMLElement | null)?.blur();
      }
    }
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  // Inline styles for iOS Safari compatibility
  const bgColor = theme === "dark" ? "rgba(23, 23, 23, 0.72)" : "rgba(255, 255, 255, 0.72)";
  const inputBg = theme === "dark" ? "rgba(23, 23, 23, 0.9)" : "rgba(255, 255, 255, 0.9)";

  return (
    <ComposerPrimitive.Root 
      className="border-t border-[var(--border)] px-3 py-3 sm:px-6 sm:py-4"
      style={{ backgroundColor: bgColor }}
    >
      <div className="mx-auto flex max-w-4xl items-end gap-2 sm:gap-3">
        <ComposerPrimitive.Input
          rows={1}
          unstable_focusOnScrollToBottom={false}
          unstable_focusOnRunStart={false}
          className="max-h-[160px] min-h-[2.75rem] flex-1 resize-none overflow-y-auto rounded-[1.5rem] border border-[var(--border)] px-4 py-2.5 text-sm leading-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-strong)] sm:px-5 sm:py-3"
          style={{ backgroundColor: inputBg }}
          placeholder="Ask me anything..."
        />
        {isRunning ? (
          <ComposerPrimitive.Cancel
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:opacity-85"
            aria-label="Stop generating"
            data-cuelume-press="tick"
          >
            <Square size={16} fill="currentColor" />
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:opacity-85 disabled:opacity-40"
            aria-label="Send message"
            data-cuelume-press
          >
            <ArrowUp size={18} />
          </ComposerPrimitive.Send>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-4xl px-1 text-center text-[11px] leading-4 text-[var(--muted)]">
        Chats are processed by AI providers (OpenAI and Anthropic) and saved only in this
        browser. Please don&apos;t share sensitive information.{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-2 transition hover:text-[var(--foreground)]"
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          Privacy
        </Link>
      </p>
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
