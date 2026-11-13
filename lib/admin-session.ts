// The /admin session. A 401 from a save expires the session; the settings stay
// mounted, blurred and inert, so unsaved drafts survive. A deliberate Lock only
// shows the page as locked once the session cookie is actually cleared.

export type AdminSession = "checking" | "locked" | "open" | "expired";

export function sessionAfterCheck(signedIn: boolean): AdminSession {
  return signedIn ? "open" : "locked";
}

/** A 401 from an admin route, or a failed lock check. */
export function sessionAfterExpiry(): AdminSession {
  return "expired";
}

export function sessionAfterLock(cleared: boolean): AdminSession {
  return cleared ? "locked" : "open";
}

/** Settings stay on screen (blurred) while expired; a deliberate Lock hides them. */
export function keepsContentMounted(session: AdminSession): boolean {
  return session === "open" || session === "expired";
}

export function contentHidden(session: AdminSession): boolean {
  return session === "checking" || session === "locked";
}

export function contentBlurred(session: AdminSession): boolean {
  return session === "expired";
}
