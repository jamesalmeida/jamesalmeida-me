import type { UIMessage } from "ai";
import experienceSeed from "@/data/threads/experience.json";
import projectsSeed from "@/data/threads/projects.json";
import resumeSeed from "@/data/threads/resume.json";
import socialsSeed from "@/data/threads/socials.json";

type SeedRecord = {
  role: "assistant" | "user" | "system";
  content: string;
};

// Static thread ids — the five built-in threads
export type StaticThreadId =
  | "new-chat"
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
  id: string;           // "history-{timestamp}"
  title: string;        // first user message, truncated to ~40 chars
  icon: string;         // first 2 chars derived from title
  createdAt: number;
  sourceThreadId: string; // which thread was restarted
}

export const THREAD_STORAGE_KEY = "jamesalmeida-threads";
export const ACTIVE_THREAD_STORAGE_KEY = "jamesalmeida-active-thread";
export const HISTORY_THREADS_KEY = "jamesalmeida-history-threads";

const toMessage = (
  threadId: string,
  message: SeedRecord,
  index: number,
): UIMessage => ({
  id: `seed-${threadId}-${index}`,
  role: message.role,
  parts: [
    {
      type: "text",
      text: message.content,
    },
  ],
});

const toSeedMessages = (threadId: string, messages: SeedRecord[]) =>
  messages.map((message, index) => toMessage(threadId, message, index));

export const THREADS: PortfolioThread[] = [
  {
    id: "new-chat",
    title: "General Chat",
    icon: "JA",
    description: "Open-ended questions about James' work, strengths, and availability.",
    seeded: false,
    baseMessages: [],
  },
  {
    id: "projects",
    title: "Projects",
    icon: "PJ",
    description: "A guided tour through standout builds, rebuilds, and product work.",
    seeded: true,
    baseMessages: toSeedMessages("projects", projectsSeed as SeedRecord[]),
  },
  {
    id: "experience",
    title: "Experience",
    icon: "XP",
    description: "Career timeline across AI consulting, product engineering, and design-heavy web work.",
    seeded: true,
    baseMessages: toSeedMessages("experience", experienceSeed as SeedRecord[]),
  },
  {
    id: "socials",
    title: "Socials",
    icon: "SO",
    description: "Direct links and contact details.",
    seeded: true,
    baseMessages: toSeedMessages("socials", socialsSeed as SeedRecord[]),
  },
  {
    id: "resume",
    title: "Resume",
    icon: "CV",
    description: "Condensed resume highlights plus the PDF download.",
    seeded: true,
    baseMessages: toSeedMessages("resume", resumeSeed as SeedRecord[]),
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

const isUIMessage = (value: unknown): value is UIMessage => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "user" ||
      candidate.role === "assistant" ||
      candidate.role === "system") &&
    Array.isArray(candidate.parts) &&
    candidate.parts.every(isTextPart)
  );
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
          ? candidate.userMessages.filter(isUIMessage)
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
    return parsed.filter(
      (item): item is HistoryThread =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.icon === "string" &&
        typeof item.createdAt === "number" &&
        typeof item.sourceThreadId === "string",
    );
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
  const title =
    firstText.length > 40 ? `${firstText.slice(0, 40).trim()}\u2026` : firstText;

  const words = title.trim().split(/\s+/);
  const icon =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : title.slice(0, 2).toUpperCase();

  return {
    id: `history-${Date.now()}`,
    title,
    icon,
    createdAt: Date.now(),
    sourceThreadId,
  };
}

export function getThreadMessages(
  threadId: string,
  storedThreads: StoredThreads,
): UIMessage[] {
  // Pre-seeded thread content is represented by the suggestion pills (see
  // components/suggestions.tsx). The JSON base messages are intentionally NOT
  // loaded into the runtime — they would otherwise render as chat bubbles on
  // first view, which conflicts with the suggestion-pill landing experience.
  //
  // When the user engages a thread (clicks a suggestion or types a message),
  // the conversation starts fresh from their input, and the system prompt +
  // context.md provide the AI with enough background to answer correctly.
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
