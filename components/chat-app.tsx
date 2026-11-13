"use client";

import type { AvatarConfig } from "@jamesalmeida/agent-avatars";
import type { UIMessage } from "ai";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/components/modal";
import { SiteHeader } from "@/components/site-header";
import { SiteMenu } from "@/components/site-menu";
import { Thread } from "@/components/thread";
import { clearBriefCards } from "@/lib/brief-store";
import { clearFeedback } from "@/lib/feedback-state";
import { replyWasBlocked } from "@/lib/jev-decision";
import {
  ACTIVE_THREAD_STORAGE_KEY,
  HISTORY_THREADS_KEY,
  NEW_CHAT_ID,
  THREAD_STORAGE_KEY,
  capHistoryThreads,
  clearStoredChats,
  createHistoryThread,
  getFirstUserText,
  getThreadConversationId,
  getThreadMessages,
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
import {
  initialThreadSession,
  reduceThreadSession,
  sessionConversationId,
  sessionKey,
  sessionThreadId,
  type ThreadSession,
  type ThreadSessionEvent,
} from "@/lib/thread-session";
import type { MotionSettings } from "@/lib/motion-settings";
import { trackEvent } from "@/lib/visit";
import { MotionSettingsProvider } from "@/components/motion-settings";
import { LandingSettingsProvider, chooseHeadline } from "@/components/landing-settings";
import { DEFAULT_LANDING, type LandingSettings } from "@/lib/landing-settings";

let landingTracked = false;

function assistantReplyText(messages: UIMessage[]): string {
  const reply = [...messages].reverse().find((message) => message.role === "assistant");
  return (reply?.parts ?? [])
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n\n")
    .trim();
}

// A stored active id that is a history chat reopens it; anything else is a landing.
function hydrateSession(): ThreadSession {
  const stored = readStoredThreads();
  const history = readHistoryThreads();
  const active = resolveActiveThreadId(readStoredActiveThread(), history);
  if (active === NEW_CHAT_ID) return initialThreadSession();
  return {
    phase: "chat",
    key: 0,
    threadId: active,
    conversationId: getThreadConversationId(active, stored) ?? active,
  };
}

export function ChatApp({
  avatar,
  fallback,
  landing = DEFAULT_LANDING,
  motion,
}: {
  avatar?: AvatarConfig;
  fallback: ReactNode;
  landing?: LandingSettings;
  motion?: MotionSettings;
}) {
  // This visit's headline (the A/B test). Chosen in the first render, so the
  // landing_view event below already carries it.
  const [headline] = useState(() => chooseHeadline(landing));
  const [session, setSession] = useState<ThreadSession>(initialThreadSession);
  const [storedThreads, setStoredThreads] = useState<StoredThreads>({});
  const [historyThreads, setHistoryThreads] = useState<HistoryThread[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // The chat on screen, readable from callbacks without a stale render.
  const sessionRef = useRef(session);
  const storedThreadsRef = useRef<StoredThreads>({});
  const historyRef = useRef<HistoryThread[]>([]);
  // Stop the run when leaving this chat (same path as the Stop button).
  const cancelRunRef = useRef<(() => void) | null>(null);
  // History thread waiting for the delete confirmation.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // Latest finished reply, read out by the polite live region.
  const [announcement, setAnnouncement] = useState("");
  // True once the visitor has sent a message: Skaffen's avatar leaves the header and
  // shows above the latest reply instead.
  const [isConversation, setIsConversation] = useState(false);
  // Threads whose title has already been requested.
  const titledRef = useRef<Set<string>>(new Set());

  const applySession = useCallback((event: ThreadSessionEvent) => {
    const next = reduceThreadSession(sessionRef.current, event);
    if (next === sessionRef.current) return;
    sessionRef.current = next;
    setSession(next);
  }, []);

  // Read-modify-write from localStorage, so two tabs don't overwrite each other with
  // their own copy. On quota eviction, drop the evicted chats from the menu too.
  const updateStoredThreads = useCallback(
    (update: (current: StoredThreads) => StoredThreads, keepId?: string) => {
      const next = update(readStoredThreads());
      const written = writeStoredThreads(next, keepId) ?? next;
      storedThreadsRef.current = written;
      setStoredThreads(written);
      if (Object.keys(written).length !== Object.keys(next).length) {
        const kept = historyRef.current.filter((item) => item.id in written);
        if (kept.length !== historyRef.current.length) {
          historyRef.current = kept;
          setHistoryThreads(kept);
          writeHistoryThreads(kept);
        }
      }
    },
    [],
  );

  // One funnel event per page load: someone reached the chat.
  useEffect(() => {
    if (landingTracked) return;
    landingTracked = true;
    trackEvent("landing_view");
  }, []);

  useEffect(() => {
    const nextStoredThreads = readStoredThreads();
    const history = readHistoryThreads();
    const nextSession = hydrateSession();
    storedThreadsRef.current = nextStoredThreads;
    historyRef.current = history;
    sessionRef.current = nextSession;
    setStoredThreads(nextStoredThreads);
    setHistoryThreads(history);
    setSession(nextSession);
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
    writeStoredActiveThread(sessionThreadId(session));
  }, [session, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    writeHistoryThreads(historyThreads);
    // Drop stored messages for history threads that were capped out or deleted.
    const historyIds = new Set(historyThreads.map((item) => item.id));
    if (pruneStoredThreads(storedThreadsRef.current, historyIds) !== storedThreadsRef.current) {
      updateStoredThreads((current) => pruneStoredThreads(current, historyIds), sessionThreadId(sessionRef.current));
    }
  }, [isHydrated, historyThreads, updateStoredThreads]);

  // Another tab wrote the chats: pick them up, and leave a chat it deleted.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key !== THREAD_STORAGE_KEY &&
        event.key !== HISTORY_THREADS_KEY &&
        event.key !== ACTIVE_THREAD_STORAGE_KEY
      ) {
        return;
      }
      const nextStored = readStoredThreads();
      const nextHistory = readHistoryThreads();
      storedThreadsRef.current = nextStored;
      historyRef.current = nextHistory;
      setStoredThreads(nextStored);
      setHistoryThreads(nextHistory);
      const current = sessionRef.current;
      if (current.phase === "chat" && !nextHistory.some((item) => item.id === current.threadId)) {
        applySession({ type: "chat_deleted", threadId: current.threadId });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applySession]);

  const activeMessages = useMemo(
    () => (session.phase === "chat" ? getThreadMessages(session.threadId, storedThreads) : []),
    [session, storedThreads],
  );

  // The chat is created on first send, not after the reply, so a failed or stopped
  // chat is in Recent chats straight away and the landing always stays empty.
  const handleFirstSend = useCallback(
    (messages: UIMessage[]) => {
      const current = sessionRef.current;
      if (current.phase !== "landing") return;
      const conversationId = messages[0]?.id;
      if (!conversationId || !messages.some((message) => message.role === "user")) return;

      const history = createHistoryThread(messages, NEW_CHAT_ID);
      const withHistory = saveThreadMessages(readStoredThreads(), history.id, messages, conversationId);
      // The landing slot goes back to empty, with no conversation id.
      const emptied = saveThreadMessages(withHistory, NEW_CHAT_ID, [], "");
      const written = writeStoredThreads(emptied, history.id) ?? emptied;
      storedThreadsRef.current = written;
      setStoredThreads(written);

      // If the write had to evict old chats, drop them from Recent chats too.
      const capped = capHistoryThreads([history, ...historyRef.current]).filter(
        (item) => item.id in written,
      );
      historyRef.current = capped;
      setHistoryThreads(capped);
      writeHistoryThreads(capped);

      applySession({ type: "first_message_sent", threadId: history.id, conversationId });
    },
    [applySession],
  );

  const handleMessagesChange = useCallback(
    (threadId: string, messages: UIMessage[]) => {
      if (!isHydrated) return;
      const current = sessionRef.current;
      // A late flush from the landing after the chat moved out must not refill it.
      if (threadId === NEW_CHAT_ID && current.phase === "chat") return;
      // A deleted chat's unmount flush must not bring it back.
      if (threadId !== NEW_CHAT_ID && !historyRef.current.some((item) => item.id === threadId)) return;
      const conversationId =
        current.phase === "chat" && current.threadId === threadId ? current.conversationId : undefined;
      updateStoredThreads(
        (stored) => saveThreadMessages(stored, threadId, messages, conversationId),
        sessionThreadId(current),
      );
    },
    [isHydrated, updateStoredThreads],
  );

  const generateTitle = useCallback((historyId: string, firstMessage: string) => {
    fetch("/api/generate-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: firstMessage }),
    })
      .then((response) => response.json())
      .then(({ title }: { title: string | null }) => {
        if (!title) return;
        const next = historyRef.current.map((item) => (item.id === historyId ? { ...item, title } : item));
        historyRef.current = next;
        setHistoryThreads(next);
        writeHistoryThreads(next);
      })
      .catch(() => {});
  }, []);

  // The title waits for the first completed reply, as before. The history entry
  // already exists, so this only names it.
  const handleRunComplete = useCallback(
    (threadId: string, messages: UIMessage[]) => {
      if (titledRef.current.has(threadId)) return;
      const item = historyRef.current.find((entry) => entry.id === threadId);
      // Only a chat that still has its placeholder title needs one.
      if (!item || item.title !== "New chat") return;
      const firstText = getFirstUserText(messages);
      if (!firstText) return;
      // A blocked turn is a canned refusal. Don't send that message to the title model.
      if (replyWasBlocked(assistantReplyText(messages))) return;
      titledRef.current.add(threadId);
      generateTitle(threadId, firstText);
    },
    [generateTitle],
  );

  // Shows a fresh landing. The chat on screen was saved when its run started, so
  // leaving it doesn't lose anything.
  const handleNewChat = useCallback(() => {
    cancelRunRef.current?.();
    applySession({ type: "new_chat" });
  }, [applySession]);

  // The menu animates itself closed after these, then calls onClose.
  const handleSelectThread = useCallback(
    (threadId: string) => {
      const stored = readStoredThreads();
      const conversationId = getThreadConversationId(threadId, stored) ?? threadId;
      cancelRunRef.current?.();
      applySession({ type: "chat_opened", threadId, conversationId });
    },
    [applySession],
  );

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      const current = sessionRef.current;
      if (current.phase === "chat" && current.threadId === threadId) cancelRunRef.current?.();
      const kept = historyRef.current.filter((item) => item.id !== threadId);
      historyRef.current = kept;
      setHistoryThreads(kept);
      writeHistoryThreads(kept);
      updateStoredThreads((stored) => {
        const next = { ...stored };
        delete next[threadId];
        return next;
      }, sessionThreadId(current));
      applySession({ type: "chat_deleted", threadId });
    },
    [applySession, updateStoredThreads],
  );

  const confirmDeleteThread = useCallback(() => {
    if (pendingDeleteId) handleDeleteThread(pendingDeleteId);
    setPendingDeleteId(null);
  }, [handleDeleteThread, pendingDeleteId]);

  const handleClearAllChats = useCallback(() => {
    cancelRunRef.current?.();
    clearStoredChats();
    clearBriefCards();
    clearFeedback();
    storedThreadsRef.current = {};
    historyRef.current = [];
    titledRef.current.clear();
    setStoredThreads({});
    setHistoryThreads([]);
    applySession({ type: "all_cleared" });
  }, [applySession]);

  if (!isHydrated) {
    return fallback;
  }

  const activeThreadId = sessionThreadId(session);
  const hasChats = historyThreads.length > 0;

  return (
    <MotionSettingsProvider motion={motion}>
    <LandingSettingsProvider landing={landing} headline={headline}>
    <div className="app-shell flex flex-col overflow-hidden">
      <SiteHeader
        avatar={avatar}
        conversationId={sessionConversationId(session)}
        menuButtonRef={menuButtonRef}
        onOpenMenu={() => setIsMenuOpen(true)}
        onNewChat={handleNewChat}
        isConversation={isConversation}
      />
      <main className="flex min-h-0 flex-1 flex-col">
        <Thread
          key={sessionKey(session)}
          threadId={activeThreadId}
          conversationId={sessionConversationId(session)}
          initialMessages={activeMessages}
          onMessagesChange={handleMessagesChange}
          onFirstSend={handleFirstSend}
          onRunComplete={handleRunComplete}
          cancelRunRef={cancelRunRef}
          avatar={avatar}
          onConversationChange={setIsConversation}
          onReply={setAnnouncement}
        />
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </main>
      {isMenuOpen ? (
        <SiteMenu
          activeThreadId={activeThreadId}
          conversationId={sessionConversationId(session)}
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
    </LandingSettingsProvider>
    </MotionSettingsProvider>
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
