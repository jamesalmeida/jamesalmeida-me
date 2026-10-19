import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OFFER, SITE, WEEK_SYSTEMS } from "@/data/site";
import { getKnowledge } from "./context";
import { getSystemPrompt } from "./system-prompt";

const rawKnowledge = readFileSync(join(process.cwd(), "data", "knowledge.md"), "utf8");

describe("getKnowledge / getSystemPrompt", () => {
  const knowledge = getKnowledge();
  const prompt = getSystemPrompt();

  it("source knowledge actually contains comments and placeholders to strip", () => {
    expect(rawKnowledge).toContain("<!--");
    expect(rawKnowledge).toContain("PROVISIONAL");
    expect(rawKnowledge).toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  it("strips HTML comments and PROVISIONAL notes", () => {
    for (const text of [knowledge, prompt]) {
      expect(text).not.toContain("<!--");
      expect(text).not.toContain("-->");
      expect(text).not.toContain("PROVISIONAL");
    }
  });

  it("fills every placeholder from SITE", () => {
    expect(prompt).not.toMatch(/\{\{[^}]*\}\}/);
    for (const value of [
      SITE.email,
      SITE.bookingUrl,
      SITE.linkedin,
      SITE.github,
      SITE.resumeUrl,
      SITE.x,
      SITE.xHandle,
    ]) {
      expect(knowledge).toContain(value);
    }
  });

  it("positions consulting first and keeps one remote-role line", () => {
    expect(knowledge).toMatch(/AI consulting and software engineering/i);
    expect(knowledge).toMatch(/also open to remote building-with-AI roles/i);
    expect(knowledge).not.toMatch(/hiring portfolio first/i);
    expect(prompt).toMatch(/AI consulting and software engineering/i);
    expect(prompt).toMatch(/also open to remote building-with-AI roles/i);
    expect(prompt).not.toMatch(/hiring portfolio first/i);
    expect(knowledge).toContain("Chief of Staff");
    expect(knowledge).toMatch(/iCloud/i);
    expect(knowledge).toMatch(/pull requests/i);
  });

  it("does not brand James with the banned lab phrase", () => {
    expect(knowledge.toLowerCase()).not.toContain("one-person ai lab");
    expect(prompt).toMatch(/never say "one-person ai lab"/i);
    expect(knowledge.toLowerCase()).not.toContain("fineants");
    expect(prompt.toLowerCase()).not.toContain("fineants");
  });

  it("treats personal apps as works in progress", () => {
    expect(knowledge).toMatch(/works in progress/i);
    expect(knowledge.toLowerCase()).not.toContain("not publicly shipped");
    expect(prompt).toMatch(/works in progress/i);
    expect(prompt).toMatch(/not in production and not launched/i);
    expect(prompt.toLowerCase()).not.toContain("not publicly shipped");
  });

  it("names the systems running the week and asks before booking", () => {
    for (const system of WEEK_SYSTEMS) {
      expect(knowledge).toContain(system);
    }
    expect(prompt).toMatch(/qualifying question/i);
    expect(prompt).toMatch(/what task/i);
    expect(prompt).toContain("showConsultingOffer");
    expect(prompt).toContain("showWeekSystems");
  });

  it("includes the published offer price ranges", () => {
    for (const step of OFFER.steps) {
      expect(prompt).toContain(step.priceRange);
    }
  });
});
