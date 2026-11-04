import "server-only";

import { z } from "zod";
import { BRIEF_FIELDS, BRIEF_LEADS, MAX_BRIEF_FIELD_CHARS, type Brief, type BriefLead } from "@/lib/brief";
import { SITE } from "@/data/site";

// Shared by lib/chat-tools.ts (live tool calls) and lib/sanitize-messages.ts
// (rebuilding tool results from client-sent history). Keep both in sync here.

// No inputs. z.object strips unknown keys, so stored history that still has
// the old `reason` field validates and is sent on as `{}`.
export const bookingCtaInputSchema = z.object({});

const briefField = z.string().trim().max(MAX_BRIEF_FIELD_CHARS).optional();

const hasSubject = (brief: { who?: string; job?: string; challenge?: string }) =>
  Boolean(brief.who || brief.job || brief.challenge);
const subjectMessage = "A brief needs at least who the visitor is, the job, or what's in the way.";

// Same keys as BRIEF_FIELDS in lib/brief.ts, plus which action the card leads with.
const briefObject = z.object({
  who: briefField,
  job: briefField,
  hopingFor: briefField,
  challenge: briefField,
  tried: briefField,
  timing: briefField,
  lead: z.enum(BRIEF_LEADS).optional(),
});

// Validates stored history, which may still carry `tried`.
export const briefInputSchema = briefObject.refine(hasSubject, { message: subjectMessage });

// What the reply model fills in. New briefs stay short, so `tried` is left out.
export const briefToolInputSchema = briefObject.omit({ tried: true }).refine(hasSubject, { message: subjectMessage });

export type BookingCtaInput = z.infer<typeof bookingCtaInputSchema>;
export type BriefInput = z.infer<typeof briefInputSchema>;

export type BookingCtaOutput = {
  bookingUrl: string;
  bookingLabel: string;
  email: string;
};

export type BriefOutput = BookingCtaOutput & { brief: Brief; lead?: BriefLead };

export function bookingCtaOutput(): BookingCtaOutput {
  return {
    bookingUrl: SITE.bookingUrl,
    bookingLabel: SITE.bookingLabel,
    email: SITE.email,
  };
}

export function briefOutput(input: BriefInput): BriefOutput {
  const brief: Brief = {};
  for (const { key } of BRIEF_FIELDS) {
    const value = input[key];
    if (value) brief[key] = value;
  }
  return { ...bookingCtaOutput(), brief, ...(input.lead ? { lead: input.lead } : {}) };
}
