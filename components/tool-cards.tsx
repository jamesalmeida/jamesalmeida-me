"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import Link from "next/link";
import { selectProjects, toPublicProjects, type PublicProject } from "@/data/portfolio";
import {
  CONSULTING_OFFER_HEADLINE,
  OFFER,
  WEEK_SYSTEMS,
  WEEK_SYSTEMS_TITLE,
} from "@/data/site";
import { BookingButton, BookingCard, EmailLink } from "./booking-button";
import { KONTEKS_PROJECT_ID, KonteksDemoMedia } from "./featured-demo";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

type PortfolioArgs = {
  ids?: string[];
  group?: "featured" | "wip" | "earlier" | "all";
};

function fallbackProjects(args: PortfolioArgs | undefined): PublicProject[] {
  return toPublicProjects(selectProjects(args ?? {}));
}

function cardsFromResult(projects: unknown): PublicProject[] | null {
  if (!Array.isArray(projects)) return null;
  const cards: PublicProject[] = [];
  for (const project of projects) {
    if (!project || typeof project !== "object") continue;
    const candidate = project as Partial<PublicProject>;
    if (typeof candidate.name !== "string" || typeof candidate.oneLiner !== "string") {
      continue;
    }
    cards.push({
      id: typeof candidate.id === "string" ? candidate.id : candidate.name,
      name: candidate.name,
      oneLiner: candidate.oneLiner,
      ...(typeof candidate.role === "string" ? { role: candidate.role } : {}),
      ...(typeof candidate.status === "string" ? { status: candidate.status } : {}),
      ...(typeof candidate.url === "string" ? { url: candidate.url } : {}),
      tags: Array.isArray(candidate.tags)
        ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      group:
        candidate.group === "earlier" || candidate.group === "wip" ? candidate.group : "featured",
    });
  }
  return cards;
}

function ProjectGrid({ projects }: { projects: PublicProject[] }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
          >
            <h3 className={`text-lg tracking-[-0.02em] ${serif}`}>{project.name}</h3>
            {project.status ? (
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {project.status}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{project.oneLiner}</p>
            {project.id === KONTEKS_PROJECT_ID ? <KonteksDemoMedia className="mt-3" /> : null}
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
                className="mt-3 inline-block text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                Visit
              </a>
            ) : null}
          </article>
        ))}
      </div>
      <Link
        href="/work"
        className="inline-block text-sm text-[var(--muted)] underline-offset-4 transition hover:text-[var(--foreground)] hover:underline"
        data-cuelume-hover="whisper"
        data-cuelume-press="tick"
      >
        All projects
      </Link>
    </div>
  );
}

export function ConsultingOfferCard() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <p className="eyebrow text-xs text-[var(--muted)]">Consulting</p>
      <h3 className={`mt-2 text-2xl tracking-[-0.03em] text-[var(--foreground)] ${serif}`}>
        {CONSULTING_OFFER_HEADLINE}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{OFFER.audienceLine}</p>
      <ol className="mt-4 space-y-3">
        {OFFER.steps.map((step, index) => (
          <li key={step.id}>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {index + 1}. {step.name}{" "}
              <span className="font-normal text-[var(--muted)]">
                {step.priceRange} ({step.priceNote})
              </span>
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{step.summary}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{OFFER.defaults.eachStepOptional}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{OFFER.defaults.introCall}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BookingButton />
        <EmailLink />
      </div>
    </div>
  );
}

export function WeekSystemsCard() {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <p className="eyebrow text-xs text-[var(--muted)]">Agents</p>
      <h3 className={`mt-2 text-2xl tracking-[-0.03em] text-[var(--foreground)] ${serif}`}>
        {WEEK_SYSTEMS_TITLE}
      </h3>
      <ul className="mt-3 space-y-2">
        {WEEK_SYSTEMS.map((system) => (
          <li key={system} className="text-sm leading-6 text-[var(--foreground)]">
            {system}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const ShowConsultingOfferToolUI = makeAssistantToolUI<
  Record<string, never>,
  { headline: string }
>({
  toolName: "showConsultingOffer",
  render: () => <ConsultingOfferCard />,
});

export const ShowWeekSystemsToolUI = makeAssistantToolUI<
  Record<string, never>,
  { title: string; systems: string[] }
>({
  toolName: "showWeekSystems",
  render: () => <WeekSystemsCard />,
});

export const ShowBookingCtaToolUI = makeAssistantToolUI<
  Record<string, never>,
  { bookingUrl: string; bookingLabel: string; email: string }
>({
  toolName: "showBookingCta",
  render: () => <BookingCard />,
});

export const ShowPortfolioToolUI = makeAssistantToolUI<
  PortfolioArgs,
  { projects: PublicProject[] }
>({
  toolName: "showPortfolio",
  render: ({ args, result }) => {
    const projects = cardsFromResult(result?.projects) ?? fallbackProjects(args);
    if (projects.length === 0) return null;
    return <ProjectGrid projects={projects} />;
  },
});
