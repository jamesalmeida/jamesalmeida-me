export const SITE = {
  name: "James Almeida",
  url: "https://www.jamesalmeida.me",
  title: "James Almeida — AI consulting and software engineering",
  description:
    "James helps people and small teams get their first AI system working. He consults on automation and runs 40+ coordinated Grok Bot agents. He's also open to remote building-with-AI roles.",
  heroHeadline: "What do you want AI to do for you?",
  heroLine:
    "James helps people and small teams get their first AI system working. He's also open to remote building-with-AI roles.",
  bio: "James Almeida is a power user turned builder. He helps people and small teams get their first AI system working, and he consults on automation. He runs 40+ coordinated Grok Bot agents. He trained models at xAI and did product engineering at Leaf Group (Society6), iROKOtv, and Datadog. Contracts go through his S-Corp, General Systems Ventures. He's also open to remote building-with-AI roles.",
  locationLine: "Los Angeles / open to remote",
  email: "james@gsv.to", // PROVISIONAL: public contact email (only email shown on the site)
  bookingUrl: "https://cal.com/james-almeida/free-discovery-call", // PROVISIONAL: existing 30-min Cal event until a dedicated intro event exists
  bookingLabel: "Book a free intro call", // PROVISIONAL: CTA label
  bookingShortLabel: "Book a call",
  hireLabel: "Hire James",
  callLengthMinutes: undefined as number | undefined, // PROVISIONAL: intro-call length undecided. Do not render or state it anywhere while undefined
  linkedin: "https://linkedin.com/in/jamesworkswell",
  github: "https://github.com/jamesalmeida",
  x: "https://x.com/james_almeida",
  xHandle: "@james_almeida",
  resumeUrl: "/resume.pdf",
  // Drop a file in public/media and set src to its path (mp4/webm autoplay; gif/png/jpg/webp as an image).
  // null shows a placeholder — never a broken embed.
  konteksDemo: {
    src: null as string | null,
    poster: undefined as string | undefined,
  },
  company: {
    name: "General Systems Ventures",
    short: "GSV",
    url: "https://gsv.to",
    note: "my S-Corp; contracts and billing go through it",
  },
} as const;

export const CONSULTING_OFFER_HEADLINE = "Start with one task";

export const WEEK_SYSTEMS_TITLE = "Systems running James's week";

// The only routines the week-systems card and the bot may name.
export const WEEK_SYSTEMS = [
  "A 6am heads-up",
  "An 8:30am desk brief",
  "Triage across five inboxes",
  "Bill tracking",
  "Calendar with leave-now pings that include drive time",
  "A chief-of-staff agent coordinating 40+ agents",
] as const;

const AUDIT_CREDIT =
  "The audit fee is credited toward your first build if you go ahead within 30 days."; // PROVISIONAL: audit-credit policy (30 days)

export const OFFER = {
  audience: ["Dental offices", "Property managers", "Law offices", "Agencies"],
  audienceLine:
    "For small and mid-size teams that lose hours to repetitive admin work.",
  steps: [
    {
      id: "audit",
      name: "Audit",
      priceRange: "$500–$1,500",
      priceNote: "depending on team size",
      summary:
        "James spends about a week watching how the team works. You get a short report on the three biggest time sinks, the hours each one costs, and what automating each would save in dollars. The report is yours either way.",
    },
    {
      id: "build",
      name: "Build",
      priceRange: "$2,000–$5,000",
      priceNote: "per workflow",
      summary:
        "James builds one workflow end to end, starting with the one that saves the most time. He chooses tools that fit. There isn't a new stack to learn.",
    },
    {
      id: "retainer",
      name: "Keep it running",
      priceRange: "$1,000–$2,500",
      priceNote: "per month",
      summary:
        "James monitors it, fixes it when the underlying tools change, adds a new workflow every quarter, and sends a one-page hours-saved report every month.",
    },
  ],
  defaults: {
    introCall: "Start with a free 30-minute intro call with James.",
    reportIsYours: "The audit report is yours whether or not you go ahead.",
    oneOffFixes: "One-off fixes are available without a retainer.",
    auditCredit: AUDIT_CREDIT,
    eachStepOptional:
      "Each step is its own decision. You can stop after any of them.",
    directWithJames: "You work directly with James, from audit to retainer.",
    billing:
      "Contracts and billing go through General Systems Ventures (GSV), his S-Corp.",
    outcomesNotTools:
      "James measures the work in hours saved, not in tools installed.",
    stayAfterLaunch:
      "James stays after launch. Automations break when the apps underneath them change, and fixing that is his job, not yours.",
    yourStack: "Where he can, James builds on the tools you already pay for.",
  },
  exampleWorkflows: [
    {
      title: "Reply to every lead within 5 minutes",
      body: "Every new inquiry gets a reply and a booking link within five minutes, including nights and weekends.",
    },
    {
      title: "Chase overdue invoices",
      body: "Overdue invoices get polite reminders on a schedule, and you can see who has paid.",
    },
    {
      title: "Intake and scheduling",
      body: "One form, then the details land in your systems and the appointment gets booked.",
    },
  ],
  byBusinessType: [
    {
      id: "dental",
      label: "Dental offices",
      body: "Appointment reminders, and recall messages for patients overdue for a cleaning.",
    },
    {
      id: "property",
      label: "Property managers",
      body: "Maintenance requests sorted, routed to the right vendor, and tenants kept updated.",
    },
    {
      id: "law",
      label: "Law offices",
      body: "Intake questionnaires and document collection done before the first consult.",
    },
    {
      id: "agencies",
      label: "Agencies",
      body: "Client onboarding and monthly reports assembled without copying numbers by hand.",
    },
  ],
  faq: [
    {
      question: "Do I need to be technical?",
      answer:
        "No. You tell James how the work happens today. He handles the setup.",
    },
    {
      question: "What tools do you use?",
      answer:
        "Whatever fits your business and what you already pay for. You don't need to care about the stack.",
    },
    {
      question: "What if something breaks?",
      answer:
        "On a retainer, James fixes it. Without one, he can fix it as a one-off.",
    },
    {
      question: "Do I have to sign up for the monthly plan?",
      answer: "No. Start with the audit. Each step is its own decision.",
    },
    {
      question: "Is the audit fee wasted if I go ahead?",
      answer: AUDIT_CREDIT,
    },
    {
      question: "Who do I sign with and who bills me?",
      answer:
        "General Systems Ventures (GSV), James's S-Corp. You still work directly with him.",
    },
  ],
} as const;
