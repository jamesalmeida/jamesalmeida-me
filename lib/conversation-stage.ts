// How far a conversation got, in one place. /admin used one definition of "taken"
// (the conversation flags) and chats.ts used another (an accepted offer); both use
// this now. `blocked` is separate: a chat stays closed, but an earlier card can
// still send a lead, which /admin marks with the Blocked badge.

export type ConversationStage = "chatting" | "offered" | "taken";

export type ConversationLike = {
  briefShown?: boolean;
  bookingClicked?: boolean;
  emailClicked?: boolean;
  leadCaptured?: boolean;
  blocked?: boolean;
  offers?: readonly { outcome?: "accepted" | "declined" }[];
};

export type ConversationProgress = { stage: ConversationStage; blocked: boolean };

export function conversationStage(conversation: ConversationLike): ConversationProgress {
  const taken =
    conversation.leadCaptured === true ||
    conversation.bookingClicked === true ||
    conversation.emailClicked === true ||
    (conversation.offers ?? []).some((offer) => offer.outcome === "accepted");
  const offered = conversation.briefShown === true || (conversation.offers?.length ?? 0) > 0;
  return {
    stage: taken ? "taken" : offered ? "offered" : "chatting",
    blocked: conversation.blocked === true,
  };
}
