import "server-only";

import { tool } from "ai";
import {
  bookingCtaInputSchema,
  bookingCtaOutput,
  briefOutput,
  briefToolInputSchema,
} from "@/lib/tool-results";

export const chatTools = {
  showBookingCta: tool({
    description:
      "Show the booking card with the discovery-call link and James' email. Use when the visitor asks how to book, contact or hire James, asks about price or timing, or wants to talk before you have enough for a brief. Do not mention a call length. Still write a short text reply.",
    inputSchema: bookingCtaInputSchema,
    execute: async () => bookingCtaOutput(),
  }),
  showBrief: tool({
    description:
      "Show the visitor's brief: a short summary they can confirm at a glance, with buttons to send it to James or book a discovery call with it attached. Use once you know who they are, what they're trying to get done and what's in the way, or sooner if they want to reach James. Each field is one short plain sentence the way the visitor would say it, about 120 characters at most, never the formal wording in your notes (no \"minimize the likelihood that\"): `who`, `job` (what they're trying to get done), `hopingFor` (what matters most to them), `challenge` (what's in the way), `timing`. Leave out fields you don't know; never guess. Set `lead` to \"book\" if they have a clear, urgent job and can decide, or \"note\" if it's vaguer, unless you've been told which. Nothing is sent until the visitor clicks. Still write a short text reply.",
    inputSchema: briefToolInputSchema,
    execute: async (input) => briefOutput(input),
  }),
};
