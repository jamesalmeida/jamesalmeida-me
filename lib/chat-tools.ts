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
  weekSystemsInputSchema,
  weekSystemsOutput,
} from "@/lib/tool-results";

const projectIds = PROJECTS.map((project) => `${project.id} (${project.name})`).join(", ");

export const chatTools = {
  showConsultingOffer: tool({
    description:
      'Show the consulting offer card. This is the published "start with one task" offer: the intro call, then the audit, build, and retainer steps from the offer. Use when the visitor asks what you offer, what it costs, how a project starts, or how you work with a business. Do not invent prices. Still write a short text reply.',
    inputSchema: consultingOfferInputSchema,
    execute: async () => consultingOfferOutput(),
  }),
  showWeekSystems: tool({
    description:
      "Show the systems running my week: a 6am heads-up, an 8:30am desk brief, triage across five inboxes, bill tracking, calendar leave-now pings that include drive time, and a chief-of-staff agent coordinating 40+ agents. Use when the visitor asks what runs my week, my daily agents, or my routines. Do not add systems that are not in the card. Still write a short text reply.",
    inputSchema: weekSystemsInputSchema,
    execute: async () => weekSystemsOutput(),
  }),
  showBookingCta: tool({
    description:
      "Show the booking card with the intro-call link and email. Before calling this, ask one qualifying question, such as what task they would want automated first, unless they already answered it. Then use it when the visitor shows hiring or buying intent, asks about price, timing, availability, how to start, how to hire, or how to contact you. Do not mention a call length. Still write a short text reply.",
    inputSchema: bookingCtaInputSchema,
    execute: async () => bookingCtaOutput(),
  }),
  showPortfolio: tool({
    description: `Show project cards. Pass ids when the visitor asks about specific projects. Pass group "featured", "wip", "earlier", or "all" for a set. Known ids: ${projectIds}.`,
    inputSchema: portfolioInputSchema,
    execute: async (input) => portfolioOutput(input),
  }),
};
