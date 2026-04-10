"use client";

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  MessagePartPrimitive,
  ThreadPrimitive,
  useThread,
  useThreadRuntime,
  useThreadViewport,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { Suggestions } from "./suggestions";
import type { PortfolioThread } from "@/lib/threads";

type ThreadProps = {
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
  thread: PortfolioThread;
};

export function Thread({
  initialMessages,
  onMessagesChange,
  thread,
}: ThreadProps) {
  const runtime = useChatRuntime({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPersistence onMessagesChange={onMessagesChange} />
      <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
        <Header thread={thread} />

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

function Header({ thread }: { thread: PortfolioThread }) {
  const runtime = useThreadRuntime();
  const messages = useThread((state) => state.messages);
  const hasMessages = messages.length > 0;

  const handleRestart = () => {
    runtime.reset();
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="eyebrow text-xs text-[var(--muted)]">Active Thread</p>
        <h2 className="truncate font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-[-0.03em]">
          {thread.title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {thread.description}
        </p>
      </div>
      {hasMessages && (
        <button
          onClick={handleRestart}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] transition hover:border-black/20 hover:text-[var(--foreground)]"
          aria-label="Restart conversation"
          title="Restart"
        >
          <RotateCcw size={16} />
        </button>
      )}
    </header>
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
          className="absolute bottom-4 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:border-black/20 hover:text-[var(--foreground)]"
          aria-label="Scroll to latest message"
        >
          <ArrowDown size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-start">
      <div className="min-w-0 max-w-[85%] rounded-[1.5rem] border border-[var(--border)] bg-white/80 px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)] sm:max-w-3xl">
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
      <div className="max-w-[85%] rounded-[1.5rem] bg-black px-5 py-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.14)] sm:max-w-2xl">
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

  return (
    <ComposerPrimitive.Root className="border-t border-[var(--border)] bg-white/55 px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2 sm:gap-3">
        <ComposerPrimitive.Input
          rows={1}
          autoFocus
          className="max-h-[160px] min-h-[2.75rem] flex-1 resize-none overflow-y-auto rounded-[1.5rem] border border-[var(--border)] bg-white px-4 py-2.5 text-sm leading-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] outline-none transition placeholder:text-[var(--muted)] focus:border-black/20 sm:px-5 sm:py-3"
          placeholder="Ask about James's work, projects, stack, or availability..."
        />
        {isRunning ? (
          <ComposerPrimitive.Cancel
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:opacity-85"
            aria-label="Stop generating"
          >
            <Square size={16} fill="currentColor" />
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:opacity-85 disabled:opacity-40"
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
