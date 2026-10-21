export type Project = {
  id: string;
  name: string;
  oneLiner: string;
  company: string;
  confirmed: boolean;
};

// Approved by James (Oct 5, 2026). Only work listed here may be shown or discussed
// publicly. Personal apps are not listed: they haven't shipped, so the site and the
// assistant don't mention them.
export const PROJECTS: Project[] = [
  {
    id: "society6",
    name: "Society6 Artist Studio",
    company: "Leaf Group (Society6)",
    oneLiner:
      "Rebuilt the artist workflow in React so creators could design and manage products.",
    confirmed: true,
  },
  {
    id: "irokotv",
    name: "iROKOtv rebuild",
    company: "iROKOtv",
    oneLiner: "End-to-end React rebuild of the streaming product's frontend.",
    confirmed: true,
  },
  {
    id: "datadog",
    name: "Datadog website rebuild",
    company: "Datadog",
    oneLiner: "Led a full rebuild of DatadogHQ.com with company leadership.",
    confirmed: true,
  },
];
