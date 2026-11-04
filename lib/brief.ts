// The visitor's brief: a short summary Skaffen writes once it understands what
// the visitor needs. Client-safe and pure. The server tool (lib/tool-results.ts)
// and the brief card (components/tool-cards.tsx) both use it.

// `tried` stays so briefs stored before the job card still render. New briefs leave it out.
export const BRIEF_FIELDS = [
  { key: "who", label: "Who" },
  { key: "job", label: "Trying to get done" },
  { key: "hopingFor", label: "What matters most" },
  { key: "challenge", label: "What's in the way" },
  { key: "tried", label: "Tried so far" },
  { key: "timing", label: "Timing" },
] as const;

export type BriefKey = (typeof BRIEF_FIELDS)[number]["key"];
export type Brief = Partial<Record<BriefKey, string>>;

export const MAX_BRIEF_FIELD_CHARS = 200;
export const MAX_NOTE_CHARS = 500;

// Which action the card leads with: a clear, urgent job leads with booking, a vaguer one with a note.
export const BRIEF_LEADS = ["book", "note"] as const;
export type BriefLead = (typeof BRIEF_LEADS)[number];

// The filled fields, in display order.
export function briefEntries(brief: Brief): { key: BriefKey; label: string; value: string }[] {
  return BRIEF_FIELDS.flatMap(({ key, label }) => {
    const value = brief[key]?.trim();
    return value ? [{ key, label, value }] : [];
  });
}

export function briefText(brief: Brief): string {
  return briefEntries(brief)
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n");
}

export function briefMailtoHref(email: string, brief: Brief, note = ""): string {
  const added = note.trim() ? `\n${note.trim()}\n` : "";
  const body = `Hi James,\n\nHere's what I talked through with Skaffen on your site:\n\n${briefText(brief)}\n${added}`;
  const params = new URLSearchParams({ subject: "Discovery call", body });
  // mailto bodies need %20, not "+", for spaces.
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`;
}

// Cal.com prefills a booking field from a query parameter with the field's name.
// "notes" is the default "Additional notes" field.
export function briefBookingHref(bookingUrl: string, brief: Brief): string {
  const text = briefText(brief);
  if (!text) return bookingUrl;
  const url = new URL(bookingUrl);
  url.searchParams.set("notes", text);
  return url.toString();
}
