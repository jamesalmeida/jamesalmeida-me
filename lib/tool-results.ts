import "server-only";

import { z } from "zod";
import {
  getProjects,
  getProjectsByIds,
  toPublicProjects,
  type Project,
  type PublicProject,
} from "@/data/portfolio";
import { SITE } from "@/data/site";

// Shared by lib/chat-tools.ts (live tool calls) and lib/sanitize-messages.ts
// (rebuilding tool results from client-sent history). Keep both in sync here.

export const bookingCtaInputSchema = z.object({
  reason: z.string().optional(),
});

export const portfolioInputSchema = z.object({
  ids: z.array(z.string()).optional(),
  group: z.enum(["featured", "earlier", "all"]).optional(),
});

export type BookingCtaInput = z.infer<typeof bookingCtaInputSchema>;
export type PortfolioInput = z.infer<typeof portfolioInputSchema>;

export type BookingCtaOutput = {
  bookingUrl: string;
  bookingLabel: string;
  email: string;
};

export type PortfolioOutput = { projects: PublicProject[] };

export function selectProjects(input: PortfolioInput): Project[] {
  if (input.ids && input.ids.length > 0) {
    return getProjectsByIds(input.ids);
  }
  if (input.group === "featured" || input.group === "earlier") {
    return getProjects(input.group);
  }
  return getProjects();
}

export function bookingCtaOutput(): BookingCtaOutput {
  return {
    bookingUrl: SITE.bookingUrl,
    bookingLabel: SITE.bookingLabel,
    email: SITE.email,
  };
}

export function portfolioOutput(input: PortfolioInput): PortfolioOutput {
  return { projects: toPublicProjects(selectProjects(input)) };
}
