"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/components/modal";
import { Thread } from "@/components/thread";
import { ThreadList } from "@/components/thread-list";
import {
  THREADS,
  THREADS_BY_ID,
  capHistoryThreads,
  clearStoredChats,
  createHistoryThread,
  getFirstUserText,
  getThreadMessages,
  getThreadPreview,
  isStaticThreadId,
  pruneStoredThreads,
  readHistoryThreads,
  readStoredActiveThread,
  readStoredThreads,
  saveThreadMessages,
  writeHistoryThreads,
  writeStoredActiveThread,
  writeStoredThreads,
  type HistoryThread,
  type PortfolioThread,
  type StoredThreads,
} from "@/lib/threads";

export function ChatApp({ fallback }: { fallback: ReactNode }) {
  const [activeThreadId, setActiveThreadId] = useState<string>("new-chat");
  const [storedThreads, setStoredThreads] = useState<StoredThreads>({});
  const [historyThreads, setHistoryThreads] = useState<HistoryThread[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  // Latest stored threads, so writes can happen synchronously (e.g. on pagehide).
  const storedThreadsRef = useRef<StoredThreads>({});
  // Bumped by "Clear all chats". Remounts the thread, and saves from the old
  // thread (e.g. its unmount flush) are ignored so cleared chats don't come back.
  const [chatGeneration, setChatGeneration] = useState(0);
  const chatGenerationRef = useRef(0);
  // History thread waiting for the delete confirmation.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Latest finished reply, read out by the polite live region. It lives here, not
  // in Thread, because the first reply forks the thread and remounts it.
  const [announcement, setAnnouncement] = useState("");

  // Updates state and writes localStorage right away. If storage was full and
  // history threads were evicted, drop them from the sidebar too.
  const updateStoredThreads = useCallback(
    (update: (current: StoredThreads) => StoredThreads) => {
      const next = update(storedThreadsRef.current);
      const written = writeStoredThreads(next) ?? next;
      storedThreadsRef.current = written;
      setStoredThreads(written);
      if (written !== next) {
        setHistoryThreads((prev) => prev.filter((item) => item.id in written));
      }
    },
    [],
  );

  useEffect(() => {
    const nextStoredThreads = readStoredThreads();
    storedThreadsRef.current = nextStoredThreads;
    setStoredThreads(nextStoredThreads);
    const requested = new URLSearchParams(window.location.search).get("thread");
    setActiveThreadId(
      requested && isStaticThreadId(requested) ? requested : readStoredActiveThread(),
    );
    setHistoryThreads(readHistoryThreads());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const updateAppHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };
    updateAppHeight();
    window.visualViewport?.addEventListener("resize", updateAppHeight);
    window.addEventListener("resize", updateAppHeight);
    window.addEventListener("orientationchange", updateAppHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateAppHeight);
      window.removeEventListener("resize", updateAppHeight);
      window.removeEventListener("orientationchange", updateAppHeight);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeStoredActiveThread(activeThreadId);
  }, [activeThreadId, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    writeHistoryThreads(historyThreads);
    // Drop stored messages for history threads that were capped out or deleted.
    const historyIds = new Set(historyThreads.map((item) => item.id));
    if (pruneStoredThreads(storedThreadsRef.current, historyIds) !== storedThreadsRef.current) {
      updateStoredThreads((current) => pruneStoredThreads(current, historyIds));
    }
  }, [isHydrated, historyThreads, updateStoredThreads]);

  const activeThread = useMemo((): PortfolioThread => {
    if (THREADS_BY_ID[activeThreadId]) return THREADS_BY_ID[activeThreadId];
    const history = historyThreads.find((item) => item.id === activeThreadId);
    if (history) {
      return {
        id: history.id,
        title: history.title,
        icon: history.icon,
        description: `Saved on ${new Date(history.createdAt).toLocaleDateString()}`,
        seeded: false,
        baseMessages: [],
      };
    }
    return THREADS_BY_ID["new-chat"];
  }, [activeThreadId, historyThreads]);

  const activeMessages = useMemo(
    () => getThreadMessages(activeThreadId, storedThreads),
    [activeThreadId, storedThreads],
  );

  const previews = useMemo(
    () => ({
      ...Object.fromEntries(
        THREADS.map((thread) => [thread.id, getThreadPreview(thread.id, storedThreads)]),
      ),
      ...Object.fromEntries(
        historyThreads.map((item) => [item.id, getThreadPreview(item.id, storedThreads, item.title)]),
      ),
    }),
    [storedThreads, historyThreads],
  );

  const handleThreadChange = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsSidebarOpen(false);
  };

  const handleMessagesChange = (threadId: string, messages: UIMessage[], generation: number) => {
    if (generation !== chatGenerationRef.current) return;
    updateStoredThreads((current) => saveThreadMessages(current, threadId, messages));
  };

  const generateTitle = useCallback((historyId: string, firstMessage: string) => {
    fetch("/api/generate-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: firstMessage }),
    })
      .then((response) => response.json())
      .then(({ title }: { title: string | null }) => {
        if (!title) return;
        setHistoryThreads((prev) =>
          prev.map((item) => (item.id === historyId ? { ...item, title } : item)),
        );
      })
      .catch(() => {});
  }, []);

  const handleRunComplete = useCallback(
    (messages: UIMessage[]) => {
      if (!isStaticThreadId(activeThreadId)) return;
      if (messages.length === 0) return;
      const history = createHistoryThread(messages, activeThreadId);
      updateStoredThreads((prev) => {
        const withHistory = saveThreadMessages(prev, history.id, messages);
        return saveThreadMessages(withHistory, activeThreadId, []);
      });
      setHistoryThreads((prev) => capHistoryThreads([history, ...prev]));
      setActiveThreadId(history.id);
      const firstText = getFirstUserText(messages);
      if (firstText) generateTitle(history.id, firstText);
    },
    [activeThreadId, generateTitle, updateStoredThreads],
  );

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      if (activeThreadId === threadId) {
        setActiveThreadId("new-chat");
      }
      setHistoryThreads((prev) => prev.filter((item) => item.id !== threadId));
      updateStoredThreads((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
    },
    [activeThreadId, updateStoredThreads],
  );

  const confirmDeleteThread = useCallback(() => {
    if (pendingDeleteId) handleDeleteThread(pendingDeleteId);
    setPendingDeleteId(null);
  }, [handleDeleteThread, pendingDeleteId]);

  const handleRestart = useCallback(
    (messages: UIMessage[]) => {
      if (messages.length === 0) return;
      const history = createHistoryThread(messages, activeThreadId);
      updateStoredThreads((prev) => {
        const withHistory = saveThreadMessages(prev, history.id, messages);
        return saveThreadMessages(withHistory, activeThreadId, []);
      });
      setHistoryThreads((prev) => capHistoryThreads([history, ...prev]));
      const firstText = getFirstUserText(messages);
      if (firstText) generateTitle(history.id, firstText);
    },
    [activeThreadId, generateTitle, updateStoredThreads],
  );

  const handleClearAllChats = useCallback(() => {
    chatGenerationRef.current += 1;
    clearStoredChats();
    storedThreadsRef.current = {};
    setStoredThreads({});
    setHistoryThreads([]);
    setActiveThreadId("new-chat");
    setChatGeneration(chatGenerationRef.current);
  }, []);

  const handleRenameThread = useCallback(
    (newTitle: string) => {
      setHistoryThreads((prev) =>
        prev.map((item) => (item.id === activeThreadId ? { ...item, title: newTitle } : item)),
      );
    },
    [activeThreadId],
  );

  if (!isHydrated) {
    return fallback;
  }

  return (
    <div className="app-shell relative overflow-hidden px-3 sm:px-4 min-[431px]:py-4">
      <div className="app-panel grain-panel flex overflow-hidden rounded-[2rem] border border-[var(--border)]">
        <ThreadList
          activeThreadId={activeThreadId}
          historyThreads={historyThreads}
          isOpen={isSidebarOpen}
          onClearAllChats={handleClearAllChats}
          onDeleteThread={setPendingDeleteId}
          onOpenChange={setIsSidebarOpen}
          onSelectThread={handleThreadChange}
          previews={previews}
          threads={THREADS}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <h1 className="sr-only">James Almeida</h1>
          <Thread
            key={`${activeThreadId}:${chatGeneration}`}
            initialMessages={activeMessages}
            onDeleteThread={!isStaticThreadId(activeThreadId) ? () => setPendingDeleteId(activeThreadId) : undefined}
            onMessagesChange={(messages) => handleMessagesChange(activeThreadId, messages, chatGeneration)}
            onRenameThread={!isStaticThreadId(activeThreadId) ? handleRenameThread : undefined}
            onReply={setAnnouncement}
            onRestart={handleRestart}
            onRunComplete={handleRunComplete}
            thread={activeThread}
          />
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </main>
      </div>
      {pendingDeleteId ? (
        <ConfirmDeleteDialog
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={confirmDeleteThread}
        />
      ) : null}
    </div>
  );
}

function ConfirmDeleteDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal labelledBy={titleId} onClose={onCancel} initialFocusRef={cancelRef}>
      <div className="relative w-full max-w-sm rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <h2
          id={titleId}
          className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-2xl tracking-[-0.02em]"
        >
          Delete chat?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          This chat is removed from this browser. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
            data-cuelume-press="tick"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
