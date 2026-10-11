import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OFFER, SITE } from "@/data/site";
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

  it("positions hiring first and describes the agent setup", () => {
    expect(knowledge).toMatch(/hiring portfolio first/i);
    expect(knowledge).toContain("Chief of Staff");
    expect(knowledge).toMatch(/iCloud/i);
    expect(knowledge).toMatch(/pull requests/i);
  });

  it("does not brand James with the banned lab phrase", () => {
    expect(knowledge.toLowerCase()).not.toContain("one-person ai lab");
  });

  it("treats personal apps as works in progress", () => {
    expect(knowledge).toMatch(/works in progress/i);
    expect(knowledge).toMatch(/not publicly shipped/i);
    expect(prompt).toMatch(/not shipped, not in production, and not launched/i);
  });

  it("includes the published offer price ranges", () => {
    for (const step of OFFER.steps) {
      expect(prompt).toContain(step.priceRange);
    }
  });
});
