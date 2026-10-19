import "server-only";

import { tool } from "ai";
import { PROJECTS } from "@/data/portfolio";
import {
  bookingCtaInputSchema,
  bookingCtaOutput,
  consultingOfferInputSchema,
  consultingOfferOutput,
  portfolioInputSchema,
  portfolioOutput,
} from "@/lib/tool-results";

const projectIds = PROJECTS.map((project) => `${project.id} (${project.name})`).join(", ");

export const chatTools = {
  showConsultingOffer: tool({
    description:
      "Show the consulting offer card: who it's for, and Audit, Build, and Keep it running with the published price ranges and notes. Use when the visitor asks what consulting costs, how working together works, or about the offer. Takes no input. Do not invent prices. Still write a short text reply.",
    inputSchema: consultingOfferInputSchema,
    execute: async () => consultingOfferOutput(),
  }),
  showBookingCta: tool({
    description:
      "Show the booking card with the intro-call link and email. Use when the visitor explicitly asks to book, get in touch, or contact you, or when they want to hire you for a role. For consulting interest (a project, their business, pricing, how to start, timing), do not call this until you have already asked one qualifying question about their project or business. Do not mention a call length. Still write a short text reply.",
    inputSchema: bookingCtaInputSchema,
    execute: async () => bookingCtaOutput(),
  }),
  showPortfolio: tool({
    description: `Show project cards. Pass ids when the visitor asks about specific projects. Pass group "featured", "wip", "earlier", or "all" for a set. Known ids: ${projectIds}.`,
    inputSchema: portfolioInputSchema,
    execute: async (input) => portfolioOutput(input),
  }),
};
