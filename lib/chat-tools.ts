import "server-only";

import { tool } from "ai";
import { z } from "zod";
import {
  PROJECTS,
  getProjects,
  getProjectsByIds,
  toPublicProjects,
  type Project,
} from "@/data/portfolio";
import { SITE } from "@/data/site";

function selectProjects(input: {
  ids?: string[];
  group?: "featured" | "earlier" | "all";
}): Project[] {
  if (input.ids && input.ids.length > 0) {
    return getProjectsByIds(input.ids);
  }
  if (input.group === "featured" || input.group === "earlier") {
    return getProjects(input.group);
  }
  return getProjects();
}

const projectIds = PROJECTS.map((project) => `${project.id} (${project.name})`).join(", ");

export const chatTools = {
  showBookingCta: tool({
    description:
      "Show the booking card with the intro-call link and email. Use when the visitor shows buying intent, asks about price, timing, availability, how to start, or how to contact you. Do not mention a call length. Still write a short text reply.",
    inputSchema: z.object({
      reason: z.string().optional(),
    }),
    execute: async () => ({
      bookingUrl: SITE.bookingUrl,
      bookingLabel: SITE.bookingLabel,
      email: SITE.email,
    }),
  }),
  showPortfolio: tool({
    description: `Show project cards. Pass ids when the visitor asks about specific projects. Pass group "featured", "earlier", or "all" for a set. Known ids: ${projectIds}.`,
    inputSchema: z.object({
      ids: z.array(z.string()).optional(),
      group: z.enum(["featured", "earlier", "all"]).optional(),
    }),
    execute: async (input) => ({
      projects: toPublicProjects(selectProjects(input)),
    }),
  }),
};
