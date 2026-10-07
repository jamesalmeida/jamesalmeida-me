import Link from "next/link";
import { BookingButton, EmailLink } from "@/components/booking-button";
import { OFFER, SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

export function StaticIntro() {
  return (
    <div className="app-shell flex items-stretch justify-center px-3 sm:px-4 min-[431px]:py-4">
      <div className="app-panel grain-panel overflow-y-auto rounded-[2rem] border border-[var(--border)]">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8 sm:px-10 sm:py-12">
          <div className="space-y-3">
            <p className="eyebrow text-xs text-[var(--muted)]">Los Angeles / remote</p>
            <h1 className={`text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>
              James Almeida
            </h1>
            <p className="text-lg text-[var(--foreground)]">
              AI consultant for small businesses, and software engineer.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
            <p>{SITE.description}</p>
            <p>
              {OFFER.defaults.introCall} {OFFER.defaults.eachStepOptional}
            </p>
            <p>
              {OFFER.defaults.directWithJames} {OFFER.defaults.outcomesNotTools}
            </p>
          </div>
          <ol className="space-y-3">
            {OFFER.steps.map((step, index) => (
              <li
                key={step.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {index + 1}. {step.name}
                  </span>
                  <span className="text-sm text-[var(--foreground)]">
                    {step.priceRange}
                    <span className="text-[var(--muted)]"> ({step.priceNote})</span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/consulting"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Consulting
            </Link>
            <Link
              href="/work"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Portfolio
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Privacy
            </Link>
            <a
              href={SITE.resumeUrl}
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Resume
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BookingButton />
            <EmailLink />
          </div>
        </div>
      </div>
    </div>
  );
}
