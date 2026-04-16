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
import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, RotateCcw, Square, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Suggestions } from "./suggestions";
import { useTheme } from "./theme-provider";
import type { PortfolioThread } from "@/lib/threads";

type ThreadProps = {
  initialMessages: UIMessage[];
  onDeleteThread?: () => void;
  onMessagesChange: (messages: UIMessage[]) => void;
  onRenameThread?: (title: string) => void;
  onRestart?: (messages: UIMessage[]) => void;
  onRunComplete?: (messages: UIMessage[]) => void;
  thread: PortfolioThread;
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
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPersistence onMessagesChange={onMessagesChange} />
      <RunCompleteDetector onRunComplete={onRunComplete} />
      <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
        <Header thread={thread} onDeleteThread={onDeleteThread} onRenameThread={onRenameThread} onRestart={onRestart} />

        <div className="relative min-h-0 flex-1">
          <ThreadPrimitive.Viewport className="absolute inset-0 overflow-y-auto px-4 pb-6 pt-6 sm:px-6">
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
          </ThreadPrimitive.Viewport>
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

    if (!justFinished || hasFired.current || !onRunComplete) return;
    if (messages.length === 0) return;

    hasFired.current = true;
    const formatted: UIMessage[] = messages.map((msg, index) => ({
      id: msg.id || `msg-${index}`,
      role: msg.role,
      parts: msg.content.map((part) => {
        if (part.type === "text") return { type: "text" as const, text: part.text };
        return { type: "text" as const, text: "" };
      }),
    }));
    onRunComplete(formatted);
  }, [isRunning, messages, onRunComplete]);

  return null;
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

  const handleRestart = () => {
    if (onRestart && messages.length > 0) {
      const formatted: UIMessage[] = messages.map((msg, index) => ({
        id: msg.id || `msg-${index}`,
        role: msg.role,
        parts: msg.content.map((part) => {
          if (part.type === "text") return { type: "text" as const, text: part.text };
          return { type: "text" as const, text: "" };
        }),
      }));
      onRestart(formatted);
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
    if (trimmed && onRenameThread) onRenameThread(trimmed);
    setIsRenaming(false);
  };

  // Inline styles for iOS Safari compatibility
  const bgColor = theme === "dark" ? "rgba(23, 23, 23, 0.72)" : "rgba(255, 255, 255, 0.72)";
  const btnBg = theme === "dark" ? "rgba(23, 23, 23, 0.9)" : "rgba(255, 255, 255, 0.9)";
  const menuBg = theme === "dark" ? "rgba(28, 28, 28, 0.98)" : "rgba(255, 255, 255, 0.98)";

  return (
    <>
      <header
        className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6 lg:gap-0 lg:justify-between"
        style={{ backgroundColor: bgColor }}
      >
        <div className="h-10 w-10 flex-shrink-0 lg:hidden" aria-hidden />
        <div className="min-w-0 flex-1 text-center lg:flex-initial lg:text-left">
          <p className="eyebrow text-xs text-[var(--muted)]">James Almeida</p>
          <h2 className="truncate font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-[-0.03em]">
            {thread.title}
          </h2>
          <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-[var(--muted)] lg:block">
            {thread.description}
          </p>
        </div>

        {onDeleteThread ? (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              style={{ backgroundColor: btnBg }}
              aria-label="Thread options"
              title="Options"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-[1rem] border border-[var(--border)] shadow-[0_16px_40px_rgba(0,0,0,0.14)]"
                  style={{ backgroundColor: menuBg }}
                >
                  <button
                    onClick={openRename}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[var(--foreground)] transition hover:bg-[var(--panel)]"
                  >
                    <Pencil size={14} className="text-[var(--muted)]" />
                    Rename
                  </button>
                  <div className="mx-3 border-t border-[var(--border)]" />
                  <button
                    onClick={() => { setIsMenuOpen(false); onDeleteThread(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 transition hover:bg-[var(--panel)]"
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
        ) : (
          <div className="h-10 w-10 flex-shrink-0 lg:hidden" aria-hidden />
        )}
      </header>

      {isRenaming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setIsRenaming(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-[-0.02em]">
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
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setIsRenaming(false); }}
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
                type="button"
                onClick={saveRename}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-foreground)] transition hover:opacity-85"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    (p) => p.type === "text" && (p as { type: "text"; text: string }).text.length > 0,
  );

  if (!hasText) {
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
      <div className="min-w-0 max-w-[85%] rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)] sm:max-w-3xl">
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
          placeholder="Ask about James..."
        />
        {isRunning ? (
          <ComposerPrimitive.Cancel
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:opacity-85"
            aria-label="Stop generating"
          >
            <Square size={16} fill="currentColor" />
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] transition hover:opacity-85 disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp size={18} />
          </ComposerPrimitive.Send>
        )}
      </div>
    </ComposerPrimitive.Root>
  );
}

function ThreadPersistence({
  onMessagesChange,
}: {
  onMessagesChange: (messages: UIMessage[]) => void;
}) {
  const messages = useThread((state) => state.messages);
  const onMessagesChangeRef = useRef(onMessagesChange);

  // Keep callback ref up to date without triggering effect
  useEffect(() => {
    onMessagesChangeRef.current = onMessagesChange;
  });

  useEffect(() => {
    // Convert assistant-ui messages to UIMessage format
    const uiMessages: UIMessage[] = messages.map((msg, index) => ({
      id: msg.id || `msg-${index}`,
      role: msg.role,
      parts: msg.content.map((part) => {
        if (part.type === "text") {
          return { type: "text", text: part.text };
        }
        return { type: "text", text: "" };
      }),
    }));
    onMessagesChangeRef.current(uiMessages);
  }, [messages]);

  return null;
}


function MarkdownText() {
  return <MarkdownTextPrimitive className="message-markdown" />;
}

function UserText() {
  return <MessagePartPrimitive.Text className="whitespace-pre-wrap leading-6" />;
}
