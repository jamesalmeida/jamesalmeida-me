// The visit, as the browser sees it: a random id for this tab session (sessionStorage,
// so it ends when the tab closes) and where the visit came from. Sent with chat
// requests, funnel events, feedback and leads. Client-only; never throws.

import type { ClientEventType, VisitContext } from "@/lib/analytics";

const VISIT_KEY = "jamesalmeida-visit";

let cachedContext: VisitContext | null = null;
let cachedVisitId: string | undefined;
let visitHeadline: string | undefined;

/** The landing headline this visit sees (the A/B test). Set before the first event. */
export function setVisitHeadline(headline: string): void {
  visitHeadline = headline;
  if (cachedContext) cachedContext.headline = headline;
}

function randomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getVisitId(): string {
  try {
    const stored = window.sessionStorage.getItem(VISIT_KEY);
    if (stored) return stored;
    const id = randomId();
    window.sessionStorage.setItem(VISIT_KEY, id);
    return id;
  } catch {
    return (cachedVisitId ??= randomId());
  }
}

/** Read once per page load: the referring site (host only), UTM tags, screen size and headline. */
export function getVisitContext(): VisitContext {
  if (cachedContext) return cachedContext;
  const context: VisitContext = visitHeadline ? { headline: visitHeadline } : {};
  try {
    const referrer = document.referrer ? new URL(document.referrer).hostname : "";
    if (referrer && referrer !== window.location.hostname) context.referrer = referrer;
    const params = new URLSearchParams(window.location.search);
    const utm = { utmSource: "utm_source", utmMedium: "utm_medium", utmCampaign: "utm_campaign" } as const;
    for (const [key, param] of Object.entries(utm) as [keyof typeof utm, string][]) {
      const value = params.get(param);
      if (value) context[key] = value.slice(0, 100);
    }
    const width = window.innerWidth;
    context.device = width < 640 ? "phone" : width < 1024 ? "tablet" : "desktop";
  } catch {
    // Keep what we have.
  }
  cachedContext = context;
  return context;
}

/** Fire-and-forget POST that survives the page navigating away (keepalive). */
export function postQuietly(url: string, body: unknown): void {
  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics never breaks the page.
  }
}

export function trackEvent(type: ClientEventType, conversationId?: string, example?: string): void {
  postQuietly("/api/events", {
    type,
    visitId: getVisitId(),
    conversationId,
    example,
    context: getVisitContext(),
  });
}
