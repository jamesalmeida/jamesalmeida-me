import type { Metadata } from "next";
import { BookingButton, EmailLink } from "@/components/booking-button";
import { SitePageShell } from "@/components/site-page-shell";
import { getProjects, type Project } from "@/data/portfolio";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Projects I've shipped, including Konteks, Fineants, Grok Pebble, Sheldn.ai, and Mercury Rx, plus earlier work.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Portfolio",
    description:
      "Projects I've shipped, including Konteks, Fineants, Grok Pebble, Sheldn.ai, and Mercury Rx, plus earlier work.",
    url: "/work",
  },
};

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <h3 className={`text-2xl tracking-[-0.03em] ${serif}`}>{project.name}</h3>
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
  const earlier = getProjects("earlier");

  return (
    <SitePageShell secondaryHref="/consulting" secondaryLabel="Consulting">
      <article className="space-y-12 pb-16">
        <header className="space-y-3">
          <p className="eyebrow text-xs text-[var(--muted)]">Work</p>
          <h1 className={`text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>Portfolio</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Software I&apos;ve designed and built, plus earlier product work.
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
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Earlier work</h2>
          <div className="grid grid-cols-1 gap-3">
            {earlier.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Work with me</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            If you want this kind of attention on the busywork in your business, {SITE.bookingLabel.toLowerCase()}.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <BookingButton />
            <EmailLink />
          </div>
        </section>
      </article>
    </SitePageShell>
  );
}
