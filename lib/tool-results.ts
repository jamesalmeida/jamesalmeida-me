import "server-only";

import { z } from "zod";
import { selectProjects, toPublicProjects, type PublicProject } from "@/data/portfolio";
import {
  CONSULTING_OFFER_HEADLINE,
  OFFER,
  SITE,
  WEEK_SYSTEMS,
  WEEK_SYSTEMS_TITLE,
} from "@/data/site";

// Shared by lib/chat-tools.ts (live tool calls) and lib/sanitize-messages.ts
// (rebuilding tool results from client-sent history). Keep both in sync here.

// No inputs. z.object strips unknown keys, so stored history that still has
// the old `reason` field validates and is sent on as `{}`.
export const bookingCtaInputSchema = z.object({});

export const consultingOfferInputSchema = z.object({});

export const weekSystemsInputSchema = z.object({});

export const portfolioInputSchema = z.object({
  ids: z.array(z.string()).optional(),
  group: z.enum(["featured", "wip", "earlier", "all"]).optional(),
});

export type BookingCtaInput = z.infer<typeof bookingCtaInputSchema>;
export type PortfolioInput = z.infer<typeof portfolioInputSchema>;

export type BookingCtaOutput = {
  bookingUrl: string;
  bookingLabel: string;
  email: string;
};

export type ConsultingOfferStep = {
  id: string;
  name: string;
  priceRange: string;
  priceNote: string;
  summary: string;
};

export type ConsultingOfferOutput = {
  headline: string;
  audienceLine: string;
  introCall: string;
  eachStepOptional: string;
  steps: ConsultingOfferStep[];
  bookingUrl: string;
  bookingLabel: string;
  email: string;
};

export type WeekSystemsOutput = {
  title: string;
  systems: string[];
};

export type PortfolioOutput = { projects: PublicProject[] };

export function bookingCtaOutput(): BookingCtaOutput {
  return {
    bookingUrl: SITE.bookingUrl,
    bookingLabel: SITE.bookingLabel,
    email: SITE.email,
  };
}

export function consultingOfferOutput(): ConsultingOfferOutput {
  return {
    headline: CONSULTING_OFFER_HEADLINE,
    audienceLine: OFFER.audienceLine,
    introCall: OFFER.defaults.introCall,
    eachStepOptional: OFFER.defaults.eachStepOptional,
    steps: OFFER.steps.map((step) => ({
      id: step.id,
      name: step.name,
      priceRange: step.priceRange,
      priceNote: step.priceNote,
      summary: step.summary,
    })),
    bookingUrl: SITE.bookingUrl,
    bookingLabel: SITE.bookingLabel,
    email: SITE.email,
  };
}

export function weekSystemsOutput(): WeekSystemsOutput {
  return {
    title: WEEK_SYSTEMS_TITLE,
    systems: [...WEEK_SYSTEMS],
  };
}

export function portfolioOutput(input: PortfolioInput): PortfolioOutput {
  return { projects: toPublicProjects(selectProjects(input)) };
}
