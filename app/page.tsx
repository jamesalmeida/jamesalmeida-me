"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Thread } from "@/components/thread";
import { ThreadList } from "@/components/thread-list";
import {
  THREADS,
  THREADS_BY_ID,
  createHistoryThread,
  getThreadMessages,
  getThreadPreview,
  isStaticThreadId,
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

export default function Home() {
  const [activeThreadId, setActiveThreadId] = useState<string>("new-chat");
  const [storedThreads, setStoredThreads] = useState<StoredThreads>({});
  const [historyThreads, setHistoryThreads] = useState<HistoryThread[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const nextStoredThreads = readStoredThreads();
    setStoredThreads(nextStoredThreads);
    setActiveThreadId(readStoredActiveThread());
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
    writeStoredThreads(storedThreads);
  }, [isHydrated, storedThreads]);

  useEffect(() => {
    if (!isHydrated) return;
    writeStoredActiveThread(activeThreadId);
  }, [activeThreadId, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    writeHistoryThreads(historyThreads);
  }, [isHydrated, historyThreads]);

  const activeThread = useMemo((): PortfolioThread => {
    if (THREADS_BY_ID[activeThreadId]) return THREADS_BY_ID[activeThreadId];
    // Active thread is a history entry — build a synthetic PortfolioThread
    const history = historyThreads.find((h) => h.id === activeThreadId);
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
        historyThreads.map((h) => [h.id, getThreadPreview(h.id, storedThreads, h.title)]),
      ),
    }),
    [storedThreads, historyThreads],
  );

  const handleThreadChange = (threadId: string) => {
    setActiveThreadId(threadId);
    setIsSidebarOpen(false);
  };

  const handleMessagesChange = (threadId: string, messages: UIMessage[]) => {
    setStoredThreads((current) => saveThreadMessages(current, threadId, messages));
  };

  // Auto-fork: after the first complete AI response on a static thread, save the
  // conversation to history and reset the original thread to stay clean.
  const handleRunComplete = useCallback(
    (messages: UIMessage[]) => {
      if (!isStaticThreadId(activeThreadId)) return;
      if (messages.length === 0) return;
      const history = createHistoryThread(messages, activeThreadId);
      setStoredThreads((prev) => {
        const withHistory = saveThreadMessages(prev, history.id, messages);
        return saveThreadMessages(withHistory, activeThreadId, []);
      });
      setHistoryThreads((prev) => [history, ...prev]);
      setActiveThreadId(history.id);
    },
    [activeThreadId],
  );

  const handleRestart = useCallback(
    (messages: UIMessage[]) => {
      if (messages.length === 0) return;
      const history = createHistoryThread(messages, activeThreadId);
      setStoredThreads((prev) => {
        const withHistory = saveThreadMessages(prev, history.id, messages);
        return saveThreadMessages(withHistory, activeThreadId, []);
      });
      setHistoryThreads((prev) => [history, ...prev]);
    },
    [activeThreadId],
  );

  if (!isHydrated) {
    return (
      <div className="app-shell flex items-center justify-center px-6">
        <div className="grain-panel rounded-[2rem] border border-[var(--border)] px-6 py-5 text-sm text-[var(--muted)]">
          Loading portfolio assistant...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell relative overflow-hidden px-3 sm:px-4 min-[431px]:py-4">
      <div className="app-panel grain-panel flex overflow-hidden rounded-[2rem] border border-[var(--border)]">
        <ThreadList
          activeThreadId={activeThreadId}
          historyThreads={historyThreads}
          isOpen={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          onSelectThread={handleThreadChange}
          previews={previews}
          threads={THREADS}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <Thread
            key={activeThreadId}
            initialMessages={activeMessages}
            onMessagesChange={(messages) => handleMessagesChange(activeThreadId, messages)}
            onRestart={handleRestart}
            onRunComplete={handleRunComplete}
            thread={activeThread}
          />
        </main>
      </div>
    </div>
  );
}
