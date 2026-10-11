export const SITE = {
  name: "James Almeida",
  url: "https://www.jamesalmeida.me",
  title: "James Almeida — building with AI",
  description:
    "Power user turned builder. I run 40+ coordinated Grok Bot agents across my household, finances, and code, and I build the tools they use. Los Angeles, open to remote.",
  heroLine:
    "I'm a power user turned builder. I run 40+ coordinated Grok Bot agents across my household, finances, and code — and I build the tools they use.",
  bio: "I'm James Almeida, a software engineer in Los Angeles, open to remote. I run 40+ coordinated Grok Bot agents across my household, finances, and code, and I build the tools they use. Before that I trained models at xAI and did product engineering at Leaf Group (Society6), iROKOtv, and Datadog. I'm looking for a remote building-with-AI role. I also consult with small businesses on automation.",
  locationLine: "Los Angeles / open to remote",
  email: "james@gsv.to", // PROVISIONAL: public contact email (only email shown on the site)
  bookingUrl: "https://cal.com/james-almeida/free-discovery-call", // PROVISIONAL: existing 30-min Cal event until a dedicated intro event exists
  bookingLabel: "Book a free intro call", // PROVISIONAL: CTA label
  bookingShortLabel: "Book a call",
  hireLabel: "Hire me / Get in touch",
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

const AUDIT_CREDIT =
  "The audit fee is credited toward your first build if you go ahead within 30 days."; // PROVISIONAL: audit-credit policy (30 days)

export const OFFER = {
  audience: ["Dental offices", "Property managers", "Law offices", "Agencies"],
  audienceLine:
    "For small businesses whose teams lose hours to repetitive admin work.",
  steps: [
    {
      id: "audit",
      name: "Audit",
      priceRange: "$500–$1,500",
      priceNote: "depending on team size",
      summary:
        "I spend about a week watching how your team works. You get a short report on the three biggest time sinks, the hours each one costs, and what automating each would save in dollars. The report is yours either way.",
    },
    {
      id: "build",
      name: "Build",
      priceRange: "$2,000–$5,000",
      priceNote: "per workflow",
      summary:
        "I build one workflow end to end, starting with the one that saves the most time. I choose tools that fit. You don't have a new stack to learn.",
    },
    {
      id: "retainer",
      name: "Keep it running",
      priceRange: "$1,000–$2,500",
      priceNote: "per month",
      summary:
        "I monitor it, fix it when the underlying tools change, add a new workflow every quarter, and send a one-page hours-saved report every month.",
    },
  ],
  defaults: {
    introCall: "Start with a free intro call.",
    reportIsYours: "The audit report is yours whether or not you go ahead.",
    oneOffFixes: "One-off fixes are available without a retainer.",
    auditCredit: AUDIT_CREDIT,
    eachStepOptional:
      "Each step is its own decision. You can stop after any of them.",
    directWithJames: "You work directly with me, from audit to retainer.",
    billing:
      "Contracts and billing go through General Systems Ventures (GSV), my S-Corp.",
    outcomesNotTools:
      "I measure the work in hours saved, not in tools installed.",
    stayAfterLaunch:
      "I stay after launch. Automations break when the apps underneath them change, and fixing that is my job, not yours.",
    yourStack: "Where I can, I build on the tools you already pay for.",
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
        "No. You tell me how the work happens today. I handle the setup.",
    },
    {
      question: "What tools do you use?",
      answer:
        "Whatever fits your business and what you already pay for. You don't need to care about the stack.",
    },
    {
      question: "What if something breaks?",
      answer:
        "On a retainer, I fix it. Without one, I can fix it as a one-off.",
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
        "General Systems Ventures (GSV), my S-Corp. You still work directly with me.",
    },
  ],
} as const;
