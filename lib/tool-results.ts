import "server-only";

import { z } from "zod";
import { BRIEF_FIELDS, MAX_BRIEF_FIELD_CHARS, type Brief } from "@/lib/brief";
import { SITE } from "@/data/site";

// Shared by lib/chat-tools.ts (live tool calls) and lib/sanitize-messages.ts
// (rebuilding tool results from client-sent history). Keep both in sync here.

// No inputs. z.object strips unknown keys, so stored history that still has
// the old `reason` field validates and is sent on as `{}`.
export const bookingCtaInputSchema = z.object({});

const briefField = z.string().trim().max(MAX_BRIEF_FIELD_CHARS).optional();

// Same keys as BRIEF_FIELDS in lib/brief.ts.
export const briefInputSchema = z
  .object({
    who: briefField,
    challenge: briefField,
    tried: briefField,
    hopingFor: briefField,
    timing: briefField,
  })
  .refine((brief) => Boolean(brief.who || brief.challenge), {
    message: "A brief needs at least who the visitor is or what's in the way.",
  });

export type BookingCtaInput = z.infer<typeof bookingCtaInputSchema>;
export type BriefInput = z.infer<typeof briefInputSchema>;

export type BookingCtaOutput = {
  bookingUrl: string;
  bookingLabel: string;
  email: string;
};

export type BriefOutput = BookingCtaOutput & { brief: Brief };

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
  return { ...bookingCtaOutput(), brief };
}
