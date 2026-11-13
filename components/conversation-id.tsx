"use client";

import { createContext, useContext } from "react";

// The conversation id the server uses. It is stored with the chat, so capping old
// messages can't change it. Tool cards, feedback and the offer events read it from
// here instead of guessing from messages[0].
export const ConversationIdContext = createContext<string | undefined>(undefined);

export function useConversationId(): string | undefined {
  return useContext(ConversationIdContext);
}
