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
      SITE.x,
      SITE.xHandle,
    ]) {
      expect(knowledge).toContain(value);
    }
  });

  it("positions the site for individuals and small teams, not hiring", () => {
    expect(knowledge).toMatch(/individuals and small teams/i);
    expect(knowledge).not.toMatch(/hiring portfolio|building-with-AI role/i);
  });

  it("introduces Skaffen as James' assistant and explains the name", () => {
    expect(prompt).toContain(`You are ${SITE.assistant.name}, ${SITE.assistant.role}`);
    expect(prompt).toMatch(/Never claim to be James/);
    expect(knowledge).toContain("Skaffen-Amtiskaw");
    expect(knowledge).toMatch(/Culture/);
  });

  it("does not brand James with the banned lab phrase", () => {
    expect(knowledge.toLowerCase()).not.toContain("one-person ai lab");
  });

  it("never names the unshipped personal apps", () => {
    for (const text of [knowledge, prompt]) {
      expect(text).not.toMatch(/Konteks|Grok Pebble|Sheldn|Mercury Rx|DGX Spark|Tesla infotainment/i);
    }
    expect(prompt).toMatch(/personal apps and side projects haven't shipped/i);
  });

  it("includes the published offer price ranges", () => {
    for (const step of OFFER.steps) {
      expect(prompt).toContain(step.priceRange);
    }
  });
});
