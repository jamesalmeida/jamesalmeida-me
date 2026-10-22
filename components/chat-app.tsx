"use client";

import type { UIMessage } from "ai";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/components/modal";
import { SiteHeader } from "@/components/site-header";
import { SiteMenu } from "@/components/site-menu";
import { Thread } from "@/components/thread";
import {
  NEW_CHAT_ID,
  capHistoryThreads,
  clearStoredChats,
  createHistoryThread,
  getFirstUserText,
  getThreadMessages,
  isStaticThreadId,
  pruneStoredThreads,
  readHistoryThreads,
  readStoredActiveThread,
  readStoredThreads,
  resolveActiveThreadId,
  saveThreadMessages,
  writeHistoryThreads,
  writeStoredActiveThread,
  writeStoredThreads,
  type HistoryThread,
  type StoredThreads,
} from "@/lib/threads";

export function ChatApp({ fallback }: { fallback: ReactNode }) {
  const [activeThreadId, setActiveThreadId] = useState<string>(NEW_CHAT_ID);
  const [storedThreads, setStoredThreads] = useState<StoredThreads>({});
  const [historyThreads, setHistoryThreads] = useState<HistoryThread[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // Latest stored threads, so writes can happen synchronously (e.g. on pagehide).
  const storedThreadsRef = useRef<StoredThreads>({});
  // Bumped by "New chat" and "Clear all chats". Remounts the thread, and saves from
  // the old thread (e.g. its unmount flush) are ignored so cleared chats don't come back.
  const [chatGeneration, setChatGeneration] = useState(0);
  const chatGenerationRef = useRef(0);
  // History thread waiting for the delete confirmation.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Latest finished reply, read out by the polite live region. It lives here, not
  // in Thread, because the first reply forks the thread and remounts it.
  const [announcement, setAnnouncement] = useState("");

  // Updates state and writes localStorage right away. If storage was full and
  // history threads were evicted, drop them from the menu too.
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
    const history = readHistoryThreads();
    setHistoryThreads(history);
    setActiveThreadId(resolveActiveThreadId(readStoredActiveThread(), history));
    setIsHydrated(true);
  }, []);

  // Fit the app to the visible area. When the iOS keyboard opens, the visual
  // viewport shrinks and also pans down the page (offsetTop), so the shell follows
  // it; otherwise the whole site slides up out of view.
  useEffect(() => {
    const root = document.documentElement;
    const updateAppHeight = () => {
      const viewport = window.visualViewport;
      root.style.setProperty("--app-height", `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty("--app-offset", `${Math.max(0, viewport?.offsetTop ?? 0)}px`);
    };
    updateAppHeight();
    window.visualViewport?.addEventListener("resize", updateAppHeight);
    window.visualViewport?.addEventListener("scroll", updateAppHeight);
    window.addEventListener("resize", updateAppHeight);
    window.addEventListener("orientationchange", updateAppHeight);
    return () => {
      window.visualViewport?.removeEventListener("resize", updateAppHeight);
      window.visualViewport?.removeEventListener("scroll", updateAppHeight);
      window.removeEventListener("resize", updateAppHeight);
      window.removeEventListener("orientationchange", updateAppHeight);
      root.style.removeProperty("--app-offset");
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    writeStoredActiveThread(activeThreadId);
  }, [activeThreadId, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    writeHistoryThreads(historyThreads);
    // Drop stored messages for history threads that were capped out or deleted,
    // and for the old pinned threads.
    const historyIds = new Set(historyThreads.map((item) => item.id));
    if (pruneStoredThreads(storedThreadsRef.current, historyIds) !== storedThreadsRef.current) {
      updateStoredThreads((current) => pruneStoredThreads(current, historyIds));
    }
  }, [isHydrated, historyThreads, updateStoredThreads]);

  const activeMessages = useMemo(
    () => getThreadMessages(activeThreadId, storedThreads),
    [activeThreadId, storedThreads],
  );

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

  // Moves the new chat's messages into a history thread and empties the new chat.
  const forkIntoHistory = useCallback(
    (messages: UIMessage[]) => {
      const history = createHistoryThread(messages, NEW_CHAT_ID);
      updateStoredThreads((prev) => {
        const withHistory = saveThreadMessages(prev, history.id, messages);
        return saveThreadMessages(withHistory, NEW_CHAT_ID, []);
      });
      setHistoryThreads((prev) => capHistoryThreads([history, ...prev]));
      const firstText = getFirstUserText(messages);
      if (firstText) generateTitle(history.id, firstText);
      return history.id;
    },
    [generateTitle, updateStoredThreads],
  );

  const handleRunComplete = useCallback(
    (messages: UIMessage[]) => {
      if (!isStaticThreadId(activeThreadId) || messages.length === 0) return;
      setActiveThreadId(forkIntoHistory(messages));
    },
    [activeThreadId, forkIntoHistory],
  );

  // Shows a fresh landing (menu "New chat" and the name in the header). A new chat
  // that never got a reply (e.g. an error) is kept in history rather than lost.
  const handleNewChat = useCallback(() => {
    if (isStaticThreadId(activeThreadId)) {
      const unsaved = storedThreadsRef.current[NEW_CHAT_ID]?.userMessages ?? [];
      chatGenerationRef.current += 1;
      if (unsaved.length > 0) forkIntoHistory(unsaved);
      setChatGeneration(chatGenerationRef.current);
      return;
    }
    setActiveThreadId(NEW_CHAT_ID);
  }, [activeThreadId, forkIntoHistory]);

  // The menu animates itself closed after these, then calls onClose.
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      if (activeThreadId === threadId) {
        setActiveThreadId(NEW_CHAT_ID);
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

  const handleClearAllChats = useCallback(() => {
    chatGenerationRef.current += 1;
    clearStoredChats();
    storedThreadsRef.current = {};
    setStoredThreads({});
    setHistoryThreads([]);
    setActiveThreadId(NEW_CHAT_ID);
    setChatGeneration(chatGenerationRef.current);
  }, []);

  if (!isHydrated) {
    return fallback;
  }

  const hasChats =
    historyThreads.length > 0 || (storedThreads[NEW_CHAT_ID]?.userMessages.length ?? 0) > 0;

  return (
    <div className="app-shell flex flex-col overflow-hidden">
      <SiteHeader
        menuButtonRef={menuButtonRef}
        onOpenMenu={() => setIsMenuOpen(true)}
        onNewChat={handleNewChat}
      />
      <main className="flex min-h-0 flex-1 flex-col">
        <Thread
          key={`${activeThreadId}:${chatGeneration}`}
          initialMessages={activeMessages}
          onMessagesChange={(messages) => handleMessagesChange(activeThreadId, messages, chatGeneration)}
          onReply={setAnnouncement}
          onRunComplete={handleRunComplete}
        />
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </main>
      {isMenuOpen ? (
        <SiteMenu
          activeThreadId={activeThreadId}
          hasChats={hasChats}
          historyThreads={historyThreads}
          onClearAllChats={handleClearAllChats}
          onClose={() => setIsMenuOpen(false)}
          onDeleteThread={setPendingDeleteId}
          onNewChat={handleNewChat}
          onSelectThread={handleSelectThread}
          returnFocusRef={menuButtonRef}
        />
      ) : null}
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
      <div className="relative w-full max-w-sm rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
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
            className="rounded-full bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
