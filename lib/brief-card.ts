import type { Brief } from "@/lib/brief";

// The brief card's flow, as one state machine: the brief being edited, whether the
// card is collapsed, whether the form is open, and where the send has got to. A
// sent card is terminal: no Edit, no "Not yet", no form.

export type SendState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "invalid"; message: string }
  | { status: "unavailable" }
  | { status: "sent"; sentBrief: Brief };

export type BriefCardState = {
  brief: Brief;
  view: "card" | "collapsed";
  editing: boolean;
  /** "closed" keeps the form mounted, so what was typed stays. */
  form: "unopened" | "open" | "closed";
  send: SendState;
};

export type BriefCardEvent =
  | { type: "edit_field"; key: keyof Brief; value: string }
  | { type: "toggle_edit" }
  | { type: "open_form" }
  | { type: "toggle_form" }
  | { type: "dismiss" }
  | { type: "restore" }
  | { type: "submit_started" }
  | { type: "submit_invalid"; message: string }
  | { type: "submit_unavailable" }
  | { type: "submit_sent"; brief: Brief }
  | { type: "restored"; brief: Brief; view: "card" | "collapsed"; sentBrief?: Brief };

export function initialBriefCard(brief: Brief): BriefCardState {
  return { brief, view: "card", editing: false, form: "unopened", send: { status: "idle" } };
}

export function isSent(state: BriefCardState): boolean {
  return state.send.status === "sent";
}

export function canEdit(state: BriefCardState): boolean {
  return !isSent(state);
}

export function canDismiss(state: BriefCardState): boolean {
  return !isSent(state) && state.send.status !== "submitting";
}

export function canSubmit(state: BriefCardState): boolean {
  return state.send.status === "idle" || state.send.status === "invalid" || state.send.status === "unavailable";
}

export function reduceBriefCard(state: BriefCardState, event: BriefCardEvent): BriefCardState {
  switch (event.type) {
    case "restored":
      return {
        brief: event.brief,
        view: event.view,
        editing: false,
        form: event.sentBrief ? "open" : state.form,
        send: event.sentBrief ? { status: "sent", sentBrief: event.sentBrief } : state.send,
      };
    case "edit_field":
      if (!state.editing || isSent(state)) return state;
      return { ...state, brief: { ...state.brief, [event.key]: event.value } };
    case "toggle_edit":
      if (!canEdit(state)) return state;
      return { ...state, editing: !state.editing };
    case "open_form":
      if (isSent(state) || state.send.status === "submitting") return state;
      return { ...state, form: "open" };
    case "toggle_form":
      // "Send to James" opens the form and closes it again, keeping what was typed.
      if (isSent(state) || state.send.status === "submitting") return state;
      return { ...state, form: state.form === "open" ? "closed" : "open" };
    case "dismiss":
      if (!canDismiss(state)) return state;
      return { ...state, view: "collapsed", editing: false };
    case "restore":
      return { ...state, view: "card" };
    case "submit_started":
      if (!canSubmit(state)) return state;
      return { ...state, send: { status: "submitting" }, editing: false };
    case "submit_invalid":
      if (state.send.status !== "submitting") return state;
      return { ...state, send: { status: "invalid", message: event.message } };
    case "submit_unavailable":
      if (state.send.status !== "submitting") return state;
      return { ...state, send: { status: "unavailable" } };
    case "submit_sent":
      return {
        ...state,
        brief: event.brief,
        view: "card",
        editing: false,
        send: { status: "sent", sentBrief: event.brief },
      };
  }
}

/** What is kept in this browser for one card, keyed by its tool call id. */
export type PersistedBriefCard = {
  brief: Brief;
  view: "card" | "collapsed";
  sentBrief?: Brief;
};

export function toPersisted(state: BriefCardState): PersistedBriefCard {
  return {
    brief: state.brief,
    view: state.view,
    ...(state.send.status === "sent" ? { sentBrief: state.send.sentBrief } : {}),
  };
}

/** Reads a stored card, keeping only known string fields like the server does. */
export function parsePersistedBriefCard(
  value: unknown,
  toBrief: (input: unknown) => Brief,
): PersistedBriefCard | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const brief = toBrief(candidate.brief);
  const view = candidate.view === "collapsed" ? "collapsed" : "card";
  const sentBrief = candidate.sentBrief ? toBrief(candidate.sentBrief) : undefined;
  return { brief, view, ...(sentBrief ? { sentBrief } : {}) };
}
