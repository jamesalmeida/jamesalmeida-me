import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton, EmailLink } from "@/components/booking-button";
import { SitePageShell } from "@/components/site-page-shell";
import { OFFER, SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

export const metadata: Metadata = {
  title: "AI consulting for small businesses",
  description: SITE.description,
  alternates: { canonical: "/consulting" },
  openGraph: {
    title: "AI consulting for small businesses",
    description: SITE.description,
    url: "/consulting",
  },
};

export default function ConsultingPage() {
  return (
    <SitePageShell secondaryHref="/work" secondaryLabel="Portfolio">
      <article className="space-y-12 pb-16">
        <header className="space-y-4">
          <p className="eyebrow text-xs text-[var(--muted)]">Consulting</p>
          <h1 className={`max-w-xl text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>
            AI consulting for small businesses
          </h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
            {SITE.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <BookingButton />
            <EmailLink />
          </div>
        </header>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Who it&apos;s for</h2>
          <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">{OFFER.audienceLine}</p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {OFFER.audience.map((name) => (
              <li
                key={name}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm"
              >
                {name}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>How it works</h2>
          <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
            {OFFER.defaults.eachStepOptional}
          </p>
          <ol className="space-y-3">
            {OFFER.steps.map((step, index) => (
              <li
                key={step.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className={`text-2xl tracking-[-0.03em] ${serif}`}>
                    {index + 1}. {step.name}
                  </h3>
                  <p className="text-sm font-medium">
                    {step.priceRange}{" "}
                    <span className="font-normal text-[var(--muted)]">({step.priceNote})</span>
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{step.summary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Example workflows</h2>
          <div className="grid gap-3">
            {OFFER.exampleWorkflows.map((workflow) => (
              <article
                key={workflow.title}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5"
              >
                <h3 className="text-sm font-medium">{workflow.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{workflow.body}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {OFFER.byBusinessType.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4"
              >
                <h3 className="text-sm font-medium">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>Why work with me</h2>
          <ul className="space-y-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
            <li>{OFFER.defaults.outcomesNotTools}</li>
            <li>{OFFER.defaults.directWithJames}</li>
            <li>{OFFER.defaults.stayAfterLaunch}</li>
            <li>{OFFER.defaults.yourStack}</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>The fine print</h2>
          <ul className="space-y-3 text-sm leading-6 text-[var(--muted)] sm:text-base">
            <li>{OFFER.defaults.reportIsYours}</li>
            <li>{OFFER.defaults.auditCredit}</li>
            <li>{OFFER.defaults.oneOffFixes}</li>
            <li>{OFFER.defaults.eachStepOptional}</li>
            <li>{OFFER.defaults.billing}</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>FAQ</h2>
          <div className="space-y-3">
            {OFFER.faq.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5"
              >
                <h3 className="text-sm font-medium">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>
            Find out where your team&apos;s hours are going.
          </h2>
          <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
            {OFFER.defaults.introCall} If there&apos;s a fit, the next step is the audit.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <BookingButton />
            <EmailLink />
          </div>
          <p>
            <Link
              href="/?thread=work-with-me"
              className="text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Prefer to ask questions first? Chat with me
            </Link>
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
