// The offer's outcome, as a transition table. Taking it wins over an earlier "Not
// yet"; accepted is terminal. Answers are tied to the offer they came from, not to
// whichever offer happens to be newest.

export type OfferAnswer = "accepted" | "declined";
export type OfferOutcomeState = OfferAnswer | undefined;

export function nextOfferOutcome(
  current: OfferOutcomeState,
  answer: OfferAnswer,
): OfferOutcomeState {
  if (current === "accepted") return "accepted";
  if (current === "declined" && answer === "declined") return "declined";
  return answer;
}

/** Whether this answer changes the stored offer, so an event is recorded only once. */
export function offerAnswerChanges(current: OfferOutcomeState, answer: OfferAnswer): boolean {
  return nextOfferOutcome(current, answer) !== current;
}
