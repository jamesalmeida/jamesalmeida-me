export type Project = {
  id: string;
  name: string;
  oneLiner: string;
  role?: string;
  status?: string;
  url?: string;
  tags: string[];
  group: "featured" | "earlier";
  confirmed: boolean;
};

export type PublicProject = Omit<Project, "confirmed">;

// Approved by James (Oct 5, 2026). Only projects listed here may be shown or discussed publicly.
const featuredProjects: Project[] = [
  {
    id: "konteks",
    name: "Konteks",
    oneLiner:
      "An iOS homescreen app that shows an AI-curated feed of context cards about what's going on in your life.",
    url: "https://konteks.app",
    tags: ["iOS", "AI"],
    group: "featured",
    confirmed: true,
  },
  {
    id: "grok-pebble",
    name: "Grok Pebble",
    oneLiner:
      "A kid-friendly Grok voice 'pebble' device with a parent web dashboard.",
    url: "https://grok-pebble.vercel.app",
    tags: ["Hardware", "Voice", "AI"],
    group: "featured",
    confirmed: true,
  },
  {
    id: "sheldn",
    name: "Sheldn.ai",
    oneLiner:
      "Managed OpenClaw hosting: your own AI assistant on WhatsApp, Telegram, or Discord without running a server yourself.",
    url: "https://sheldn.ai",
    tags: ["AI", "Hosting"],
    group: "featured",
    confirmed: true,
  },
  {
    id: "mercury-rx",
    name: "Mercury Rx",
    oneLiner:
      "An iOS app that tells you whether Mercury is in retrograde, with optional alerts.",
    tags: ["iOS"],
    group: "featured",
    confirmed: true,
  },
];

const earlierProjects: Project[] = [
  {
    id: "society6",
    name: "Society6 Artist Studio",
    oneLiner:
      "Rebuilt the artist workflow in React at Leaf Group/Society6 so creators could design and manage products.",
    tags: [],
    group: "earlier",
    confirmed: true,
  },
  {
    id: "irokotv",
    name: "iROKOtv rebuild",
    oneLiner: "End-to-end React rebuild of the streaming product's frontend.",
    tags: [],
    group: "earlier",
    confirmed: true,
  },
  {
    id: "datadog",
    name: "Datadog website rebuild",
    oneLiner: "Led a full rebuild of DatadogHQ.com with company leadership.",
    tags: [],
    group: "earlier",
    confirmed: true,
  },
];

export const PROJECTS: Project[] = [...featuredProjects, ...earlierProjects];

export function getProjects(group?: Project["group"]): Project[] {
  if (!group) return PROJECTS;
  return PROJECTS.filter((project) => project.group === group);
}

export function getProjectsByIds(ids: readonly string[]): Project[] {
  const byId = new Map(PROJECTS.map((project) => [project.id, project]));
  return ids.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });
}

export function toPublicProject(project: Project): PublicProject {
  return {
    id: project.id,
    name: project.name,
    oneLiner: project.oneLiner,
    ...(project.role ? { role: project.role } : {}),
    ...(project.status ? { status: project.status } : {}),
    ...(project.url ? { url: project.url } : {}),
    tags: project.tags,
    group: project.group,
  };
}

export function toPublicProjects(projects: readonly Project[]): PublicProject[] {
  return projects.map(toPublicProject);
}
