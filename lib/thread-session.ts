import { NEW_CHAT_ID } from "@/lib/threads";

// Which chat is on screen, kept separate from where its messages are stored. The
// `key` only changes when the thread has to remount: New chat, opening a chat, or
// clearing everything. The first message does not change it, so the composer and
// the conversation stay mounted.

export type ThreadSession =
  | { phase: "landing"; key: number }
  | { phase: "chat"; key: number; threadId: string; conversationId: string };

export type ThreadSessionEvent =
  | { type: "first_message_sent"; threadId: string; conversationId: string }
  | { type: "chat_opened"; threadId: string; conversationId: string }
  | { type: "new_chat" }
  | { type: "chat_deleted"; threadId: string }
  | { type: "all_cleared" };

export function initialThreadSession(): ThreadSession {
  return { phase: "landing", key: 0 };
}

export function reduceThreadSession(
  session: ThreadSession,
  event: ThreadSessionEvent,
): ThreadSession {
  switch (event.type) {
    case "first_message_sent":
      // Same key: the chat the visitor is in stays mounted, so half-typed text and
      // the paced reply carry on.
      return session.phase === "landing"
        ? {
            phase: "chat",
            key: session.key,
            threadId: event.threadId,
            conversationId: event.conversationId,
          }
        : session;
    case "chat_opened":
      return {
        phase: "chat",
        key: session.key + 1,
        threadId: event.threadId,
        conversationId: event.conversationId,
      };
    case "new_chat":
      return { phase: "landing", key: session.key + 1 };
    case "chat_deleted":
      return session.phase === "chat" && session.threadId === event.threadId
        ? { phase: "landing", key: session.key + 1 }
        : session;
    case "all_cleared":
      return { phase: "landing", key: session.key + 1 };
  }
}

/** The storage slot the thread on screen writes to. */
export function sessionThreadId(session: ThreadSession): string {
  return session.phase === "chat" ? session.threadId : NEW_CHAT_ID;
}

/** The conversation id the server uses, stored with the chat so it survives capping. */
export function sessionConversationId(session: ThreadSession): string | undefined {
  return session.phase === "chat" ? session.conversationId : undefined;
}

/** The key that tells React to remount the thread. */
export function sessionKey(session: ThreadSession): number {
  return session.key;
}
