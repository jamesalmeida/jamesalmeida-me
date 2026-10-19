import { describe, expect, it } from "vitest";
import {
  CONSULTING_OFFER_HEADLINE,
  OFFER,
  SITE,
  WEEK_SYSTEMS,
  WEEK_SYSTEMS_TITLE,
} from "@/data/site";
import { consultingOfferOutput, weekSystemsOutput } from "./tool-results";

const BOOKING_URL = "https://cal.com/james-almeida/free-discovery-call";

describe("consultingOfferOutput", () => {
  const offer = consultingOfferOutput();

  it("builds the start-with-one-task offer from OFFER", () => {
    expect(offer.headline).toBe(CONSULTING_OFFER_HEADLINE);
    expect(offer.headline).toBe("Start with one task");
    expect(offer.audienceLine).toBe(OFFER.audienceLine);
    expect(offer.introCall).toBe(OFFER.defaults.introCall);
    expect(offer.eachStepOptional).toBe(OFFER.defaults.eachStepOptional);
    expect(offer.steps).toEqual(
      OFFER.steps.map((step) => ({
        id: step.id,
        name: step.name,
        priceRange: step.priceRange,
        priceNote: step.priceNote,
        summary: step.summary,
      })),
    );
  });

  it("uses the published booking link and email", () => {
    expect(SITE.bookingUrl).toBe(BOOKING_URL);
    expect(offer.bookingUrl).toBe(BOOKING_URL);
    expect(offer.bookingLabel).toBe(SITE.bookingLabel);
    expect(offer.email).toBe(SITE.email);
  });

  it("does not invent clients, results, or a call length", () => {
    const serialized = JSON.stringify(offer).toLowerCase();
    expect(serialized).not.toContain("fineants");
    expect(serialized).not.toContain("one-person ai lab");
    expect(serialized).not.toContain("testimonial");
    expect(serialized).not.toMatch(/\d+\s*min/);
  });
});

describe("weekSystemsOutput", () => {
  const card = weekSystemsOutput();

  it("lists the systems running the week and nothing else", () => {
    expect(card.title).toBe(WEEK_SYSTEMS_TITLE);
    expect(card.title).toBe("Systems running my week");
    expect(card.systems).toEqual([
      "A 6am heads-up",
      "An 8:30am desk brief",
      "Triage across five inboxes",
      "Bill tracking",
      "Calendar with leave-now pings that include drive time",
      "A chief-of-staff agent coordinating 40+ agents",
    ]);
    expect(card.systems).toEqual([...WEEK_SYSTEMS]);
  });

  it("does not add clients or product names", () => {
    const serialized = JSON.stringify(card).toLowerCase();
    expect(serialized).not.toContain("fineants");
    expect(serialized).not.toContain("one-person ai lab");
    expect(serialized).not.toContain("shipped");
  });
});
