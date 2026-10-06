"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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

export function ChatApp({ fallback }: { fallback: ReactNode }) {
  const [activeThreadId, setActiveThreadId] = useState<string>("new-chat");
  const [storedThreads, setStoredThreads] = useState<StoredThreads>({});
  const [historyThreads, setHistoryThreads] = useState<HistoryThread[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const nextStoredThreads = readStoredThreads();
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

  const handleMessagesChange = (threadId: string, messages: UIMessage[]) => {
    setStoredThreads((current) => saveThreadMessages(current, threadId, messages));
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
      setStoredThreads((prev) => {
        const withHistory = saveThreadMessages(prev, history.id, messages);
        return saveThreadMessages(withHistory, activeThreadId, []);
      });
      setHistoryThreads((prev) => [history, ...prev]);
      setActiveThreadId(history.id);
      const firstUserMsg = messages.find((message) => message.role === "user");
      const firstText = firstUserMsg?.parts.find(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )?.text;
      if (firstText) generateTitle(history.id, firstText);
    },
    [activeThreadId, generateTitle],
  );

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      if (activeThreadId === threadId) {
        setActiveThreadId("new-chat");
      }
      setHistoryThreads((prev) => prev.filter((item) => item.id !== threadId));
      setStoredThreads((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
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
      const firstUserMsg = messages.find((message) => message.role === "user");
      const firstText = firstUserMsg?.parts.find(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )?.text;
      if (firstText) generateTitle(history.id, firstText);
    },
    [activeThreadId, generateTitle],
  );

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
          onDeleteThread={handleDeleteThread}
          onOpenChange={setIsSidebarOpen}
          onSelectThread={handleThreadChange}
          previews={previews}
          threads={THREADS}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <h1 className="sr-only">James Almeida</h1>
          <Thread
            key={activeThreadId}
            initialMessages={activeMessages}
            onDeleteThread={!isStaticThreadId(activeThreadId) ? () => handleDeleteThread(activeThreadId) : undefined}
            onMessagesChange={(messages) => handleMessagesChange(activeThreadId, messages)}
            onRenameThread={!isStaticThreadId(activeThreadId) ? handleRenameThread : undefined}
            onRestart={handleRestart}
            onRunComplete={handleRunComplete}
            thread={activeThread}
          />
        </main>
      </div>
    </div>
  );
}
