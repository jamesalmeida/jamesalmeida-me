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

          <div className="border-t border-[var(--border)] pt-5">
            <p className="eyebrow text-[11px] text-[var(--muted)] mb-3">Connect</p>
            <div className="flex items-center gap-2">
              <a
                href="mailto:hello@jamesalmeida.com"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white/60 text-[var(--muted)] transition hover:-translate-y-px hover:border-black/20 hover:bg-white hover:text-[var(--foreground)]"
                aria-label="Email James"
                title="Email"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
              <a
                href="https://github.com/jamesalmeida"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white/60 text-[var(--muted)] transition hover:-translate-y-px hover:border-black/20 hover:bg-white hover:text-[var(--foreground)]"
                aria-label="James on GitHub"
                title="GitHub"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/jamesalmeida"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white/60 text-[var(--muted)] transition hover:-translate-y-px hover:border-black/20 hover:bg-white hover:text-[var(--foreground)]"
                aria-label="James on LinkedIn"
                title="LinkedIn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white/60 text-[var(--muted)] transition hover:-translate-y-px hover:border-black/20 hover:bg-white hover:text-[var(--foreground)]"
                aria-label="Download Resume PDF"
                title="Resume PDF"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
              </a>
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
