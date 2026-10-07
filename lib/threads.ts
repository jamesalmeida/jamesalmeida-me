import type { UIMessage } from "ai";

// Static thread ids — built-in threads. Keep these ids so stored state survives.
export type StaticThreadId =
  | "new-chat"
  | "work-with-me"
  | "projects"
  | "experience"
  | "socials"
  | "resume";

// ThreadId is now open — includes static ids + dynamic history ids ("history-{timestamp}")
export type ThreadId = string;

export type PortfolioThread = {
  id: string;
  title: string;
  icon: string;
  description: string;
  seeded: boolean;
  baseMessages: UIMessage[];
};

export type StoredThreadState = {
  userMessages: UIMessage[];
  createdAt: number;
  lastVisited: number;
};

export type StoredThreads = Record<string, StoredThreadState>;

export interface HistoryThread {
  id: string;              // "history-{timestamp}"
  title: string;           // source thread title (e.g. "Experience")
  icon: string;            // source thread icon (e.g. "XP")
  description: string;     // first user message, truncated
  createdAt: number;
  sourceThreadId: string;  // which thread was forked from
}

export const THREAD_STORAGE_KEY = "jamesalmeida-threads";
export const ACTIVE_THREAD_STORAGE_KEY = "jamesalmeida-active-thread";
export const HISTORY_THREADS_KEY = "jamesalmeida-history-threads";

// localStorage caps. Older history threads and older messages are dropped.
export const MAX_HISTORY_THREADS = 50;
export const MAX_MESSAGES_PER_THREAD = 100;

export const THREADS: PortfolioThread[] = [
  {
    id: "new-chat",
    title: "General Chat",
    icon: "JA",
    description: "Ask me anything about my work, my consulting, or my projects.",
    seeded: false,
    baseMessages: [],
  },
  {
    id: "work-with-me",
    title: "Work with me",
    icon: "AI",
    description:
      "AI consulting for small businesses: how it works, price ranges, and booking a free intro call.",
    seeded: true,
    baseMessages: [],
  },
  {
    id: "projects",
    title: "Portfolio",
    icon: "PJ",
    description:
      "Konteks, Grok Pebble, Sheldn.ai, Mercury Rx, and earlier work.",
    seeded: true,
    baseMessages: [],
  },
  {
    id: "experience",
    title: "Experience",
    icon: "XP",
    description: "Career timeline across AI consulting, product engineering, and design-heavy web work.",
    seeded: true,
    baseMessages: [],
  },
  {
    id: "socials",
    title: "Contact",
    icon: "SO",
    description: "Book a free intro call or email me.",
    seeded: true,
    baseMessages: [],
  },
  {
    id: "resume",
    title: "Resume",
    icon: "CV",
    description: "Condensed resume highlights plus the PDF download.",
    seeded: true,
    baseMessages: [],
  },
];

export const THREADS_BY_ID: Record<string, PortfolioThread> = Object.fromEntries(
  THREADS.map((thread) => [thread.id, thread]),
);

const isTextPart = (part: unknown): part is { type: "text"; text: string } => {
  if (!part || typeof part !== "object") return false;
  const candidate = part as Record<string, unknown>;
  return candidate.type === "text" && typeof candidate.text === "string";
};

const isStoredToolPart = (part: unknown): part is UIMessage["parts"][number] => {
  if (!part || typeof part !== "object") return false;
  const candidate = part as Record<string, unknown>;
  return (
    typeof candidate.type === "string" &&
    candidate.type.startsWith("tool-") &&
    typeof candidate.toolCallId === "string" &&
    candidate.state === "output-available"
  );
};

const normalizeStoredMessage = (value: unknown): UIMessage | null => {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string") return null;
  if (
    candidate.role !== "user" &&
    candidate.role !== "assistant" &&
    candidate.role !== "system"
  ) {
    return null;
  }
  if (!Array.isArray(candidate.parts)) return null;

  const parts = candidate.parts.flatMap((part) => {
    if (isTextPart(part) || isStoredToolPart(part)) return [part];
    return [];
  });
  if (parts.length === 0) return null;

  return {
    id: candidate.id,
    role: candidate.role,
    parts,
  };
};

export function isStaticThreadId(value: string): value is StaticThreadId {
  return value in THREADS_BY_ID;
}

// Keep the old name as an alias for backward compatibility
export { isStaticThreadId as isThreadId };

// localStorage can be missing or throw (privacy modes, disabled storage). Never throw from here.
function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function safeGetItem(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, code } = error as { name?: unknown; code?: unknown };
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014
  );
}

type SetResult = "ok" | "quota" | "error";

function safeSetItem(key: string, value: string): SetResult {
  const storage = getStorage();
  if (!storage) return "error";
  try {
    storage.setItem(key, value);
    return "ok";
  } catch (error) {
    return isQuotaExceededError(error) ? "quota" : "error";
  }
}

export function capMessages(messages: UIMessage[]): UIMessage[] {
  return messages.length > MAX_MESSAGES_PER_THREAD
    ? messages.slice(-MAX_MESSAGES_PER_THREAD)
    : messages;
}

// Keeps the newest MAX_HISTORY_THREADS by createdAt, preserving order.
// Returns the same array when nothing is dropped.
export function capHistoryThreads(threads: HistoryThread[]): HistoryThread[] {
  if (threads.length <= MAX_HISTORY_THREADS) return threads;
  const keep = new Set(
    [...threads]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_HISTORY_THREADS)
      .map((thread) => thread.id),
  );
  return threads.filter((thread) => keep.has(thread.id));
}

// Drops stored messages for non-static threads that are not in the history list.
// Returns the same object when nothing is dropped.
export function pruneStoredThreads(
  storedThreads: StoredThreads,
  historyIds: ReadonlySet<string>,
): StoredThreads {
  const orphans = Object.keys(storedThreads).filter(
    (threadId) => !isStaticThreadId(threadId) && !historyIds.has(threadId),
  );
  if (orphans.length === 0) return storedThreads;
  const next = { ...storedThreads };
  for (const threadId of orphans) delete next[threadId];
  return next;
}

// Removes the oldest half (at least one) of the non-static threads by createdAt.
export function evictOldestHistory(storedThreads: StoredThreads): StoredThreads {
  const historyIds = Object.keys(storedThreads)
    .filter((threadId) => !isStaticThreadId(threadId))
    .sort((a, b) => storedThreads[a].createdAt - storedThreads[b].createdAt);
  if (historyIds.length === 0) return storedThreads;
  const next = { ...storedThreads };
  for (const threadId of historyIds.slice(0, Math.ceil(historyIds.length / 2))) {
    delete next[threadId];
  }
  return next;
}

export function readStoredThreads(): StoredThreads {
  const parsed = safeParse(safeGetItem(THREAD_STORAGE_KEY));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed as Record<string, unknown>).flatMap(([threadId, value]) => {
      if (!value || typeof value !== "object") return [];

      const candidate = value as Record<string, unknown>;
      const createdAt =
        typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now();
      const lastVisited =
        typeof candidate.lastVisited === "number"
          ? candidate.lastVisited
          : createdAt;
      const userMessages = Array.isArray(candidate.userMessages)
        ? capMessages(
            candidate.userMessages.flatMap((message) => {
              const normalized = normalizeStoredMessage(message);
              return normalized ? [normalized] : [];
            }),
          )
        : [];

      return [[threadId, { createdAt, lastVisited, userMessages }]];
    }),
  );
}

// Writes the threads. On QuotaExceededError, evicts the oldest history threads and
// retries once. Returns what was written (possibly with history evicted), or null
// if nothing could be written. Never throws.
export function writeStoredThreads(threads: StoredThreads): StoredThreads | null {
  const result = safeSetItem(THREAD_STORAGE_KEY, JSON.stringify(threads));
  if (result === "ok") return threads;
  if (result === "error") return null;

  const evicted = evictOldestHistory(threads);
  if (evicted === threads) return null;
  return safeSetItem(THREAD_STORAGE_KEY, JSON.stringify(evicted)) === "ok" ? evicted : null;
}

export function readStoredActiveThread(): string {
  return safeGetItem(ACTIVE_THREAD_STORAGE_KEY) ?? "new-chat";
}

export function writeStoredActiveThread(threadId: string) {
  safeSetItem(ACTIVE_THREAD_STORAGE_KEY, threadId);
}

export function readHistoryThreads(): HistoryThread[] {
  const parsed = safeParse(safeGetItem(HISTORY_THREADS_KEY));
  if (!Array.isArray(parsed)) return [];
  return capHistoryThreads(
    parsed
      .filter(
        (item): item is Record<string, unknown> =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          typeof item.icon === "string" &&
          typeof item.createdAt === "number" &&
          typeof item.sourceThreadId === "string",
      )
      .map((item) => ({
        id: item.id as string,
        title: item.title as string,
        icon: item.icon as string,
        description: typeof item.description === "string" ? item.description : (item.title as string),
        createdAt: item.createdAt as number,
        sourceThreadId: item.sourceThreadId as string,
      })),
  );
}

// The history list is small (at most MAX_HISTORY_THREADS entries), so a failed write is ignored.
export function writeHistoryThreads(threads: HistoryThread[]) {
  safeSetItem(HISTORY_THREADS_KEY, JSON.stringify(threads));
}

export function createHistoryThread(
  messages: UIMessage[],
  sourceThreadId: string,
): HistoryThread {
  const firstUserMsg = messages.find((m) => m.role === "user");
  const firstText =
    firstUserMsg?.parts.find(isTextPart)?.text ?? "Chat";
  const description =
    firstText.length > 72 ? `${firstText.slice(0, 72).trim()}\u2026` : firstText;

  // Use the source thread's title and icon so history entries are grouped by thread
  const sourceThread = THREADS_BY_ID[sourceThreadId];
  const title = sourceThread?.title ?? "General Chat";
  const icon = sourceThread?.icon ?? "JA";

  return {
    id: `history-${Date.now()}`,
    title,
    icon,
    description,
    createdAt: Date.now(),
    sourceThreadId,
  };
}

export function getThreadMessages(
  threadId: string,
  storedThreads: StoredThreads,
): UIMessage[] {
  // Pinned threads start empty. Suggestion pills are the landing state.
  // The system prompt carries the knowledge, so a fresh message is enough.
  return storedThreads[threadId]?.userMessages ?? [];
}

export function saveThreadMessages(
  storedThreads: StoredThreads,
  threadId: string,
  messages: UIMessage[],
): StoredThreads {
  const existing = storedThreads[threadId];
  const nextState: StoredThreadState = {
    createdAt: existing?.createdAt ?? Date.now(),
    lastVisited: Date.now(),
    userMessages: capMessages(messages),
  };

  return {
    ...storedThreads,
    [threadId]: nextState,
  };
}

export function getThreadPreview(
  threadId: string,
  storedThreads: StoredThreads,
  fallback?: string,
): string {
  const stored = storedThreads[threadId]?.userMessages ?? [];

  for (let index = stored.length - 1; index >= 0; index -= 1) {
    const message = stored[index];
    if (message.role !== "user") continue;

    const part = message.parts.find(isTextPart);
    if (!part) continue;

    return part.text.length > 72 ? `${part.text.slice(0, 72).trim()}...` : part.text;
  }

  return fallback ?? THREADS_BY_ID[threadId]?.description ?? "";
}
