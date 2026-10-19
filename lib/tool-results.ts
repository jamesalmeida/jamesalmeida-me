import "server-only";

import { z } from "zod";
import { selectProjects, toPublicProjects, type PublicProject } from "@/data/portfolio";
import { SITE } from "@/data/site";
import { consultingOfferOutput } from "@/lib/consulting-offer";

// Shared by lib/chat-tools.ts (live tool calls) and lib/sanitize-messages.ts
// (rebuilding tool results from client-sent history). Keep both in sync here.

// No inputs. z.object strips unknown keys, so stored history that still has
// the old `reason` field validates and is sent on as `{}`.
export const bookingCtaInputSchema = z.object({});

// No inputs. Unknown keys are stripped, same as the booking card.
export const consultingOfferInputSchema = z.object({});

export const portfolioInputSchema = z.object({
  ids: z.array(z.string()).optional(),
  group: z.enum(["featured", "wip", "earlier", "all"]).optional(),
});

export type BookingCtaInput = z.infer<typeof bookingCtaInputSchema>;
export type ConsultingOfferInput = z.infer<typeof consultingOfferInputSchema>;
export type PortfolioInput = z.infer<typeof portfolioInputSchema>;

export { consultingOfferOutput };
export type { ConsultingOfferOutput } from "@/lib/consulting-offer";

export type BookingCtaOutput = {
  bookingUrl: string;
  bookingLabel: string;
  email: string;
};

export type PortfolioOutput = { projects: PublicProject[] };

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
