import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { getProjects } from "@/data/portfolio";
import { OFFER, SITE } from "@/data/site";

const PLACEHOLDERS: Record<string, string> = {
  email: SITE.email,
  bookingUrl: SITE.bookingUrl,
  linkedin: SITE.linkedin,
  github: SITE.github,
  resumeUrl: SITE.resumeUrl,
};

function renderOffer(): string {
  const steps = OFFER.steps
    .map(
      (step) =>
        `### ${step.name}\nPrice range: ${step.priceRange} (${step.priceNote})\n${step.summary}`,
    )
    .join("\n\n");

  const defaults = Object.values(OFFER.defaults)
    .map((line) => `- ${line}`)
    .join("\n");

  const examples = OFFER.exampleWorkflows
    .map((workflow) => `- **${workflow.title}.** ${workflow.body}`)
    .join("\n");

  const byType = OFFER.byBusinessType
    .map((item) => `- **${item.label}.** ${item.body}`)
    .join("\n");

  const faq = OFFER.faq
    .map((item) => `**${item.question}** ${item.answer}`)
    .join("\n\n");

  return [
    "## Offer and pricing (authoritative)",
    "",
    `Who it's for: ${OFFER.audience.join(", ")}. ${OFFER.audienceLine}`,
    "",
    steps,
    "",
    "### Defaults",
    defaults,
    "",
    "### Example workflows",
    examples,
    "",
    "### By business type",
    byType,
    "",
    "### FAQ",
    faq,
  ].join("\n");
}

function renderPortfolio(): string {
  const format = (group: "featured" | "earlier") =>
    getProjects(group)
      .map((project) => {
        const link = project.url ? ` (${project.url})` : "";
        return `- **${project.name}.** ${project.oneLiner}${link}`;
      })
      .join("\n");

  return [
    "## Portfolio",
    "",
    "### Featured",
    format("featured"),
    "",
    "### Earlier work",
    format("earlier"),
  ].join("\n");
}

export const getKnowledge = cache((): string => {
  const raw = readFileSync(join(process.cwd(), "data", "knowledge.md"), "utf8");
  const stripped = raw.replace(/<!--[\s\S]*?-->/g, "");
  const filled = stripped.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return PLACEHOLDERS[key] ?? match;
  });

  return `${filled.trim()}\n\n${renderOffer()}\n\n${renderPortfolio()}\n`;
});

export const getContext = getKnowledge;
