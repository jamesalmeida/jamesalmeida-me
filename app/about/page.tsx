import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton, EmailLink } from "@/components/booking-button";
import { SitePageShell } from "@/components/site-page-shell";
import { PROJECTS } from "@/data/portfolio";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const description =
  "Why I help individuals and small teams find their place in a world with AI, and what I bring to it.";

export const metadata: Metadata = {
  title: "Why I do this",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Why I do this",
    description,
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <SitePageShell>
      <article className="space-y-12 pb-16">
        <header className="space-y-4">
          <p className="eyebrow text-xs text-[var(--muted)]">Why I do this</p>
          <h1 className={`max-w-xl text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>
            Nobody should have to figure out AI alone.
          </h1>
        </header>

        <section className="max-w-2xl space-y-4 text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          <p>
            I&apos;ve spent the last few years living inside AI: training models at xAI, building
            with it every day, and running a lot of my own work and home on agents I set up
            myself. I&apos;ve watched it change faster than anyone expected.
          </p>
          <p>
            It&apos;s slowly finding its way into every job, including yours. That can feel like a
            lot. But the people who do best with it don&apos;t learn &ldquo;AI&rdquo; in general.
            They find one or two things in their own week that it can take off their plate, and
            build from there.
          </p>
          <p>
            That&apos;s what I help with. Whether it&apos;s just you or a small team, I&apos;d like
            to help you find your place in this new world, at your pace, starting with whatever is
            on your plate today.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>What I bring</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            Before AI, I spent about a decade as a software engineer. Some of the work I shipped:
          </p>
          <ul className="grid gap-3">
            {PROJECTS.map((project) => (
              <li
                key={project.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5"
              >
                <h3 className="text-sm font-medium">
                  {project.name}{" "}
                  <span className="font-normal text-[var(--muted)]">at {project.company}</span>
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{project.oneLiner}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>About {SITE.assistant.name}</h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            The chat on this site is run by {SITE.assistant.name}, my AI assistant. It&apos;s named
            after Skaffen-Amtiskaw, the drone in Iain M. Banks&apos; <em>Use of Weapons</em>. I&apos;m
            a big fan of the Culture novels.
          </p>
        </section>

        <section className="space-y-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          <h2 className={`text-3xl tracking-[-0.03em] ${serif}`}>What can I do for you?</h2>
          <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
            Start with a free discovery call, or tell {SITE.assistant.name} what you&apos;re working
            on first.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <BookingButton />
            <EmailLink />
          </div>
          <p>
            <Link
              href="/"
              className="text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              Chat with {SITE.assistant.name}
            </Link>
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
