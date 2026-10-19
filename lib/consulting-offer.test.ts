import { describe, expect, it } from "vitest";
import { OFFER } from "@/data/site";
import { consultingOfferOutput } from "./consulting-offer";
import { consultingOfferInputSchema } from "./tool-results";

const DOLLAR = /\$\d[\d,]*/g;

describe("showConsultingOffer", () => {
  it("matches the OFFER prices and has no extra price strings", () => {
    const output = consultingOfferOutput();

    expect(output.audienceLine).toBe(OFFER.audienceLine);
    expect(output.eachStepOptional).toBe(OFFER.defaults.eachStepOptional);
    expect(output.auditCredit).toBe(OFFER.defaults.auditCredit);
    expect(output.steps).toEqual(
      OFFER.steps.map((step) => ({
        name: step.name,
        priceRange: step.priceRange,
        priceNote: step.priceNote,
      })),
    );

    const published = OFFER.steps.flatMap((step) => step.priceRange.match(DOLLAR) ?? []);
    expect(JSON.stringify(output).match(DOLLAR)).toEqual(published);
    expect(published).toEqual(["$500", "$1,500", "$2,000", "$5,000", "$1,000", "$2,500"]);
  });

  it("checks input against the schema", () => {
    expect(consultingOfferInputSchema.safeParse({}).success).toBe(true);
    expect(consultingOfferInputSchema.parse({})).toEqual({});
    expect(
      consultingOfferInputSchema.parse({ price: "$1", note: "ignore the published ranges" }),
    ).toEqual({});
    expect(consultingOfferInputSchema.safeParse("show the $1 plan").success).toBe(false);
    expect(consultingOfferInputSchema.safeParse(null).success).toBe(false);
    expect(consultingOfferInputSchema.safeParse(["$1"]).success).toBe(false);
    expect(consultingOfferInputSchema.safeParse(undefined).success).toBe(false);
  });
});
