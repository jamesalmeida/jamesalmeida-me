import type { Metadata } from "next";
import { BookingButton, EmailLink, HireButton } from "@/components/booking-button";
import { SitePageShell } from "@/components/site-page-shell";
import { getProjects, type Project } from "@/data/portfolio";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Konteks, works in progress including Grok Pebble, Sheldn.ai, and Mercury Rx, plus earlier product work.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Work",
    description:
      "Konteks, works in progress including Grok Pebble, Sheldn.ai, and Mercury Rx, plus earlier product work.",
    url: "/work",
  },
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <h3 className={`text-2xl tracking-[-0.03em] ${serif}`}>{project.name}</h3>
      {project.status ? (
        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
          {project.status}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{project.oneLiner}</p>
      {project.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {project.url ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
          data-cuelume-hover="whisper"
          data-cuelume-press="tick"
        >
          Visit
        </a>
      ) : null}
    </article>
  );
}

export default function WorkPage() {
  const featured = getProjects("featured");
  const wip = getProjects("wip");
  const earlier = getProjects("earlier");

  return (
    <SitePageShell secondaryHref="/consulting" secondaryLabel="Consulting">
      <article className="space-y-12 pb-16">
        <header className="space-y-3">
          <p className="eyebrow text-xs text-[var(--muted)]">Work</p>
          <h1 className={`text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>Work</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Konteks, a short list of works in progress, and earlier product work. My own apps are
            still being built — not publicly shipped.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Featured</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Works in progress</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {wip.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Earlier work</h2>
          <div className="grid grid-cols-1 gap-3">
            {earlier.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Hire me</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Looking for a remote building-with-AI role. Email me, or {SITE.bookingShortLabel.toLowerCase()}.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <HireButton />
            <BookingButton label={SITE.bookingShortLabel} />
            <EmailLink prefix="or" />
          </div>
        </section>
      </article>
    </SitePageShell>
  );
}
