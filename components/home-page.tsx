import { BookingOutlineButton, HireButton } from "@/components/booking-button";
import { ChatApp } from "@/components/chat-app";
import { FeaturedDemo } from "@/components/featured-demo";
import { SiteNav } from "@/components/site-nav";
import { getProjects } from "@/data/portfolio";
import { OFFER, SITE } from "@/data/site";
import Link from "next/link";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const contactLinkClass =
  "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2.5 text-sm text-[var(--foreground)] transition hover:-translate-y-px hover:border-[var(--border-strong)]";

function ChatFallback() {
  return (
    <div className="flex h-full min-h-[inherit] flex-col justify-center gap-2 px-6 py-8">
      <p className="eyebrow text-xs text-[var(--muted)]">Chat</p>
      <p className={`text-2xl tracking-[-0.03em] ${serif}`}>Ask me anything.</p>
      <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
        The chat is the demo. Ask how the agent setup works, what I&apos;m building, or how to
        hire me.
      </p>
    </div>
  );
}

export function HomePage() {
  const wip = getProjects("wip");

  return (
    <div className="site-page">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteNav current="home" />

        <article className="space-y-16 pb-16">
          <header className="max-w-3xl space-y-4">
            <p className="eyebrow text-xs text-[var(--muted)]">{SITE.locationLine}</p>
            <h1 className={`text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>{SITE.name}</h1>
            <p className="text-lg leading-7 text-[var(--foreground)] sm:text-xl">{SITE.heroLine}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <HireButton />
              <BookingOutlineButton />
            </div>
          </header>

          <section id="chat" className="space-y-4 scroll-mt-4">
            <p className="eyebrow text-xs text-[var(--muted)]">Proof</p>
            <h2 className={`text-3xl tracking-[-0.03em] sm:text-4xl ${serif}`}>Chat with me</h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              This chatbot is the centerpiece. It speaks as me, from the same knowledge I use
              everywhere else on the site.
            </p>
            <ChatApp embedded fallback={<ChatFallback />} />
          </section>

          <FeaturedDemo />

          <section id="wip" className="space-y-4">
            <p className="eyebrow text-xs text-[var(--muted)]">Building</p>
            <h2 className={`text-3xl tracking-[-0.03em] sm:text-4xl ${serif}`}>Works in progress</h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Personal apps, roughly built, not publicly shipped.
            </p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {wip.map((project) => (
                <li
                  key={project.id}
                  className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5"
                >
                  <h3 className={`text-xl tracking-[-0.03em] ${serif}`}>{project.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{project.oneLiner}</p>
                </li>
              ))}
            </ul>
            <p>
              <Link
                href="/work"
                className="text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                Earlier work and details
              </Link>
            </p>
          </section>

          <section id="contact" className="space-y-4">
            <p className="eyebrow text-xs text-[var(--muted)]">About</p>
            <h2 className={`text-3xl tracking-[-0.03em] sm:text-4xl ${serif}`}>About + contact</h2>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">{SITE.bio}</p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${SITE.email}`}
                className={contactLinkClass}
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                {SITE.email}
              </a>
              <a
                href={SITE.x}
                target="_blank"
                rel="noopener noreferrer"
                className={contactLinkClass}
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                {SITE.xHandle}
              </a>
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className={contactLinkClass}
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                GitHub
              </a>
              <a
                href={SITE.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={contactLinkClass}
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                {SITE.bookingShortLabel}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <HireButton />
              <BookingOutlineButton />
            </div>
          </section>

          <section id="consulting" className="space-y-4 border-t border-[var(--border)] pt-12">
            <p className="eyebrow text-xs text-[var(--muted)]">Also</p>
            <h2 className={`text-3xl tracking-[-0.03em] sm:text-4xl ${serif}`}>Consulting</h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              {OFFER.audienceLine} Audit, build, optional retainer — each step is its own
              decision.
            </p>
            <p>
              <Link
                href="/consulting"
                className="text-sm text-[var(--foreground)] underline-offset-4 hover:underline"
                data-cuelume-hover="whisper"
                data-cuelume-press="tick"
              >
                Read the offer
              </Link>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
