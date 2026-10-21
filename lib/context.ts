import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROJECTS } from "@/data/portfolio";
import { OFFER, SITE } from "@/data/site";

const PLACEHOLDERS: Record<string, string> = {
  email: SITE.email,
  bookingUrl: SITE.bookingUrl,
  linkedin: SITE.linkedin,
  github: SITE.github,
  x: SITE.x,
  xHandle: SITE.xHandle,
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

function renderPastWork(): string {
  const projects = PROJECTS.map(
    (project) => `- **${project.name}** (${project.company}). ${project.oneLiner}`,
  ).join("\n");

  return ["## Past work (shipped at those companies)", "", projects].join("\n");
}

// Module-level memo: react `cache()` only dedupes within a render, so route
// handlers re-read knowledge.md on every request without this.
let knowledge: string | undefined;

export function getKnowledge(): string {
  if (knowledge !== undefined) return knowledge;
  const raw = readFileSync(join(process.cwd(), "data", "knowledge.md"), "utf8");
  const stripped = raw.replace(/<!--[\s\S]*?-->/g, "");
  const filled = stripped.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return PLACEHOLDERS[key] ?? match;
  });

  knowledge = `${filled.trim()}\n\n${renderOffer()}\n\n${renderPastWork()}\n`;
  return knowledge;
}
