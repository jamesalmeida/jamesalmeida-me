"use client";

import type { PortfolioThread, ThreadId } from "@/lib/threads";

type ThreadListProps = {
  activeThreadId: ThreadId;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectThread: (threadId: ThreadId) => void;
  previews: Record<ThreadId, string>;
  threads: PortfolioThread[];
};

export function ThreadList({
  activeThreadId,
  isOpen,
  onOpenChange,
  onSelectThread,
  previews,
  threads,
}: ThreadListProps) {
  const seededThreads = threads.filter((thread) => thread.seeded);
  const newChatThread = threads.find((thread) => thread.id === "new-chat");

  return (
    <>
      <button
        className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-lg text-[var(--foreground)] lg:hidden"
        onClick={() => onOpenChange(!isOpen)}
        aria-label="Open menu"
      >
        ☰
      </button>

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex w-[21rem] max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--panel-strong)] transition-transform duration-300 lg:static lg:max-w-none lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 lg:hidden">
          <div className="text-sm font-medium">Navigation</div>
          <button
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
            onClick={() => onOpenChange(false)}
          >
            CLOSE
          </button>
        </div>

        <div className="flex flex-1 flex-col px-5 py-5">
          <div className="space-y-3 border-b border-[var(--border)] pb-5">
            <p className="eyebrow text-xs text-[var(--muted)]">AI portfolio</p>
            <div>
              <h1 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-[1.85rem] leading-none tracking-[-0.04em]">
                James Almeida
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">
                A chat-first portfolio covering projects, experience, socials, and
                the full resume.
              </p>
            </div>
          </div>

          <nav className="mt-5 flex-1 space-y-6">
            {newChatThread ? (
              <div className="space-y-2">
                <p className="eyebrow text-[11px] text-[var(--muted)]">Default</p>
                <ThreadButton
                  isActive={activeThreadId === newChatThread.id}
                  onClick={() => onSelectThread(newChatThread.id)}
                  preview={previews[newChatThread.id]}
                  thread={newChatThread}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="eyebrow text-[11px] text-[var(--muted)]">Pre-seeded</p>
              <div className="space-y-2">
                {seededThreads.map((thread) => (
                  <ThreadButton
                    key={thread.id}
                    isActive={activeThreadId === thread.id}
                    onClick={() => onSelectThread(thread.id)}
                    preview={previews[thread.id]}
                    thread={thread}
                  />
                ))}
              </div>
            </div>
          </nav>

          <div className="space-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)]">
            <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/60 p-4 leading-6">
              Use the seeded threads like pages, or stay in New Chat for a free-form
              conversation.
            </div>
          </div>
        </div>
      </aside>

      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      ) : null}
    </>
  );
}

type ThreadButtonProps = {
  isActive: boolean;
  onClick: () => void;
  preview: string;
  thread: PortfolioThread;
};

function ThreadButton({
  isActive,
  onClick,
  preview,
  thread,
}: ThreadButtonProps) {
  return (
    <button
      className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition duration-200 ${
        isActive
          ? "border-black/20 bg-black text-white shadow-[0_18px_42px_rgba(0,0,0,0.14)]"
          : "border-[var(--border)] bg-white/65 hover:-translate-y-px hover:border-black/20 hover:bg-white"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={`eyebrow rounded-full border px-2 py-1 text-[10px] ${
            isActive
              ? "border-white/20 text-white/70"
              : "border-black/10 text-[var(--muted)]"
          }`}
        >
          {thread.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{thread.title}</div>
          <p
            className={`mt-1 text-sm leading-5 ${
              isActive ? "text-white/78" : "text-[var(--muted)]"
            }`}
          >
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
