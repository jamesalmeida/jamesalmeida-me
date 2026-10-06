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
      "Konteks, Fineants, Grok Pebble, Sheldn.ai, Mercury Rx, and earlier work.",
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

export function readStoredThreads(): StoredThreads {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(THREAD_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([threadId, value]) => {
        if (!value || typeof value !== "object") return [];

        const candidate = value as Record<string, unknown>;
        const createdAt =
          typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now();
        const lastVisited =
          typeof candidate.lastVisited === "number"
            ? candidate.lastVisited
            : createdAt;
        const userMessages = Array.isArray(candidate.userMessages)
          ? candidate.userMessages.flatMap((message) => {
              const normalized = normalizeStoredMessage(message);
              return normalized ? [normalized] : [];
            })
          : [];

        return [[threadId, { createdAt, lastVisited, userMessages }]];
      }),
    );
  } catch {
    return {};
  }
}

export function writeStoredThreads(threads: StoredThreads) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(threads));
}

export function readStoredActiveThread(): string {
  if (typeof window === "undefined") return "new-chat";
  return window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY) ?? "new-chat";
}

export function writeStoredActiveThread(threadId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, threadId);
}

export function readHistoryThreads(): HistoryThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
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
      }));
  } catch {
    return [];
  }
}

export function writeHistoryThreads(threads: HistoryThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_THREADS_KEY, JSON.stringify(threads));
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
    userMessages: messages,
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
