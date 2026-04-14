import type { UIMessage } from "ai";
import experienceSeed from "@/data/threads/experience.json";
import projectsSeed from "@/data/threads/projects.json";
import resumeSeed from "@/data/threads/resume.json";
import socialsSeed from "@/data/threads/socials.json";

type SeedRecord = {
  role: "assistant" | "user" | "system";
  content: string;
};

export type ThreadId =
  | "new-chat"
  | "projects"
  | "experience"
  | "socials"
  | "resume";

export type PortfolioThread = {
  id: ThreadId;
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

export const THREAD_STORAGE_KEY = "jamesalmeida-threads";
export const ACTIVE_THREAD_STORAGE_KEY = "jamesalmeida-active-thread";

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

export const THREADS_BY_ID = Object.fromEntries(
  THREADS.map((thread) => [thread.id, thread]),
) as Record<ThreadId, PortfolioThread>;

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

export function isThreadId(value: string): value is ThreadId {
  return value in THREADS_BY_ID;
}

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

export function readStoredActiveThread(): ThreadId {
  if (typeof window === "undefined") return "new-chat";

  const value = window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
  return value && isThreadId(value) ? value : "new-chat";
}

export function writeStoredActiveThread(threadId: ThreadId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, threadId);
}

export function getThreadMessages(
  threadId: ThreadId,
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
  threadId: ThreadId,
  messages: UIMessage[],
): StoredThreads {
  // Base messages are no longer injected into the runtime, so all rendered
  // messages are user-originated or assistant replies to user input. Store
  // them as-is.
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
  threadId: ThreadId,
  storedThreads: StoredThreads,
): string {
  const stored = storedThreads[threadId]?.userMessages ?? [];

  for (let index = stored.length - 1; index >= 0; index -= 1) {
    const message = stored[index];
    if (message.role !== "user") continue;

    const part = message.parts.find(isTextPart);
    if (!part) continue;

    return part.text.length > 72 ? `${part.text.slice(0, 72).trim()}...` : part.text;
  }

  return THREADS_BY_ID[threadId].description;
}
