"use client";

import type { UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";
import { Thread } from "@/components/thread";
import { ThreadList } from "@/components/thread-list";
import {
  THREADS,
  THREADS_BY_ID,
  getThreadMessages,
  getThreadPreview,
  readStoredActiveThread,
  readStoredThreads,
  saveThreadMessages,
  type StoredThreads,
  type ThreadId,
  writeStoredActiveThread,
  writeStoredThreads,
} from "@/lib/threads";

export default function Home() {
  const [activeThreadId, setActiveThreadId] = useState<ThreadId>("new-chat");
  const [storedThreads, setStoredThreads] = useState<StoredThreads>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const nextStoredThreads = readStoredThreads();
    setStoredThreads(nextStoredThreads);
    setActiveThreadId(readStoredActiveThread());
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

  const activeThread = THREADS_BY_ID[activeThreadId];
  const activeMessages = useMemo(
    () => getThreadMessages(activeThreadId, storedThreads),
    [activeThreadId, storedThreads],
  );

  const previews = useMemo(
    () =>
      Object.fromEntries(
        THREADS.map((thread) => [thread.id, getThreadPreview(thread.id, storedThreads)]),
      ) as Record<ThreadId, string>,
    [storedThreads],
  );

  const handleThreadChange = (threadId: ThreadId) => {
    setActiveThreadId(threadId);
    setIsSidebarOpen(false);
  };

  const handleMessagesChange = (threadId: ThreadId, messages: UIMessage[]) => {
    setStoredThreads((current) => saveThreadMessages(current, threadId, messages));
  };

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
    <div className="app-shell relative overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
      <div className="app-panel grain-panel flex overflow-hidden rounded-[2rem] border border-[var(--border)]">
        <ThreadList
          activeThreadId={activeThreadId}
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
            thread={activeThread}
          />
        </main>
      </div>
    </div>
  );
}
