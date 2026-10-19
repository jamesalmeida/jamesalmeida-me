import { OFFER } from "@/data/site";

// Client-safe. The chat tool, the card, and message sanitizing all read this
// so a stored or forged tool payload cannot introduce a different price.

export type ConsultingOfferStep = {
  name: string;
  priceRange: string;
  priceNote: string;
};

export type ConsultingOfferOutput = {
  audienceLine: string;
  steps: ConsultingOfferStep[];
  eachStepOptional: string;
  auditCredit: string;
};

export function consultingOfferOutput(): ConsultingOfferOutput {
  return {
    audienceLine: OFFER.audienceLine,
    steps: OFFER.steps.map((step) => ({
      name: step.name,
      priceRange: step.priceRange,
      priceNote: step.priceNote,
    })),
    eachStepOptional: OFFER.defaults.eachStepOptional,
    auditCredit: OFFER.defaults.auditCredit,
  };
}
