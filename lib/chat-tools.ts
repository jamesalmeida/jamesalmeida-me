import "server-only";

import { tool } from "ai";
import {
  bookingCtaInputSchema,
  bookingCtaOutput,
  briefInputSchema,
  briefOutput,
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
      "Show the visitor's brief: a short summary of what they told you, with buttons to email it to James or book a discovery call with it attached. Use once you know who they are and what's in the way (usually after 2 to 4 questions), or sooner if they want to reach James. Each field is one short plain sentence in the visitor's own terms, at most 200 characters. Leave out fields you don't know; never guess. Nothing is sent until the visitor clicks. Still write a short text reply.",
    inputSchema: briefInputSchema,
    execute: async (input) => briefOutput(input),
  }),
};
