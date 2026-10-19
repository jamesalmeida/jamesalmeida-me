import Link from "next/link";
import { BookingOutlineButton, HireButton } from "@/components/booking-button";
import { getProjects } from "@/data/portfolio";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const linkClass = "text-[var(--foreground)] underline-offset-4 hover:underline";

// Server-rendered before the chat hydrates. Same app-shell/app-panel frame as
// ChatApp, so there is no layout shift, and crawlers get real text and an h1.
export function StaticIntro() {
  const wip = [...getProjects("featured"), ...getProjects("wip")];

  return (
    <div className="app-shell flex items-stretch justify-center px-3 sm:px-4 min-[431px]:py-4">
      <div className="app-panel grain-panel w-full overflow-y-auto rounded-[2rem] border border-[var(--border)]">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 sm:px-10 sm:py-12">
          <div className="space-y-3">
            <p className="eyebrow text-xs text-[var(--muted)]">{SITE.locationLine}</p>
            <h1 className={`text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>{SITE.name}</h1>
            <p className="text-lg leading-7 text-[var(--foreground)]">{SITE.heroLine}</p>
          </div>
          <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">{SITE.bio}</p>
          <div className="space-y-2">
            <p className="eyebrow text-xs text-[var(--muted)]">Works in progress</p>
            <ul className="flex flex-wrap gap-2">
              {wip.map((project) => (
                <li
                  key={project.id}
                  className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm"
                >
                  {project.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <HireButton />
            <BookingOutlineButton />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link href="/work" className={linkClass} data-cuelume-hover="whisper" data-cuelume-press="tick">
              Work
            </Link>
            <Link
              href="/consulting"
              className={linkClass}
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Consulting
            </Link>
            <Link href="/privacy" className={linkClass} data-cuelume-hover="whisper" data-cuelume-press="tick">
              Privacy
            </Link>
            <a href={SITE.resumeUrl} className={linkClass} data-cuelume-hover="whisper" data-cuelume-press="tick">
              Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
