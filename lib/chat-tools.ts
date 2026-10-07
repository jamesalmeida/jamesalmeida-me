import "server-only";

import { tool } from "ai";
import { PROJECTS } from "@/data/portfolio";
import {
  bookingCtaInputSchema,
  bookingCtaOutput,
  portfolioInputSchema,
  portfolioOutput,
} from "@/lib/tool-results";

const projectIds = PROJECTS.map((project) => `${project.id} (${project.name})`).join(", ");

export const chatTools = {
  showBookingCta: tool({
    description:
      "Show the booking card with the intro-call link and email. Use when the visitor shows buying intent, asks about price, timing, availability, how to start, or how to contact you. Do not mention a call length. Still write a short text reply.",
    inputSchema: bookingCtaInputSchema,
    execute: async () => bookingCtaOutput(),
  }),
  showPortfolio: tool({
    description: `Show project cards. Pass ids when the visitor asks about specific projects. Pass group "featured", "earlier", or "all" for a set. Known ids: ${projectIds}.`,
    inputSchema: portfolioInputSchema,
    execute: async (input) => portfolioOutput(input),
  }),
};
