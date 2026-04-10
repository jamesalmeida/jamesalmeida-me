"use client";

import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  MessagePartPrimitive,
  ThreadPrimitive,
  useThread,
} from "@assistant-ui/react";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useChat } from "@ai-sdk/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { Suggestions } from "./suggestions";
import type { PortfolioThread } from "@/lib/threads";

type ThreadProps = {
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
  onOpenSidebar: () => void;
  thread: PortfolioThread;
};

export function Thread({
  initialMessages,
  onMessagesChange,
  onOpenSidebar,
  thread,
}: ThreadProps) {
  const chat = useChat();
  
  // Set initial messages when thread changes
  useEffect(() => {
    if (initialMessages.length > 0) {
      chat.setMessages(initialMessages);
    }
  }, [thread.id]);
  
  const runtime = useAISDKRuntime(chat);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPersistence onMessagesChange={onMessagesChange} />
      <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col">
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
          <button
            className="hidden rounded-full border border-[var(--border)] px-4 py-2 text-xs tracking-[0.18em] text-[var(--muted)] transition hover:border-black/20 hover:text-[var(--foreground)] lg:block"
            onClick={onOpenSidebar}
            type="button"
          >
            THREADS
          </button>
        </header>

        <ThreadPrimitive.Viewport className="relative flex-1 overflow-y-auto px-4 pb-6 pt-6 sm:px-6">
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
          <ThreadPrimitive.ScrollToBottom className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-xs text-[var(--muted)] shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition hover:border-black/20 hover:text-[var(--foreground)]">
            Jump to latest
          </ThreadPrimitive.ScrollToBottom>
        </ThreadPrimitive.Viewport>

        <Composer />
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-start">
      <div className="flex max-w-3xl gap-4">
        <div className="eyebrow mt-1 h-6 flex-shrink-0 rounded-full border border-[var(--border)] px-2 py-1 text-[10px] leading-none text-[var(--muted)] flex items-center justify-center">
          AI
        </div>
        <div className="min-w-0 rounded-[1.5rem] border border-[var(--border)] bg-white/80 px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
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
      </div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex w-full justify-end">
      <div className="flex max-w-2xl flex-row-reverse gap-4">
        <div className="eyebrow mt-1 h-6 flex-shrink-0 rounded-full border border-black/10 bg-black px-2 py-1 text-[10px] leading-none text-white/75 flex items-center justify-center">
          You
        </div>
        <div className="rounded-[1.5rem] bg-black px-5 py-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          <MessagePrimitive.Parts
            components={{
              Text: UserText,
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  const isRunning = useThread((state) => state.isRunning);

  return (
    <ComposerPrimitive.Root className="border-t border-[var(--border)] bg-white/55 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-4xl items-end gap-3">
        <ComposerPrimitive.Input
          className="min-h-[4rem] flex-1 rounded-[1.5rem] border border-[var(--border)] bg-white px-5 py-4 text-sm leading-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] outline-none transition placeholder:text-[var(--muted)] focus:border-black/20"
          placeholder="Ask about James's work, projects, stack, or availability..."
        />
        {isRunning ? (
          <ComposerPrimitive.Cancel className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-85">
            Stop
          </ComposerPrimitive.Cancel>
        ) : (
          <ComposerPrimitive.Send className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-85">
            Send
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
