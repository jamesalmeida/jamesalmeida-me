import type { Metadata } from "next";
import { SitePageShell } from "@/components/site-page-shell";
import { SITE } from "@/data/site";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const description =
  "How the chat on this site handles what you type: who processes it, where it's stored, and how to delete it.";

export const metadata: Metadata = {
  title: "Privacy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy",
    description,
    url: "/privacy",
  },
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What happens to your messages",
    body: (
      <>
        <p>
          When you send a message, the recent messages in that chat (up to the last 20) go to my
          server and on to the AI model provider that writes the reply: OpenAI or Anthropic,
          depending on which model I have the chat set to. The first message of a new chat is
          also sent to generate a short title for it. The providers handle that data under their
          API terms.
        </p>
        <p>
          My server doesn&apos;t save your messages. This site has no database, and my code
          doesn&apos;t keep chat transcripts or write chat content to logs.
        </p>
        <p>Please don&apos;t share sensitive information, such as patient or customer details.</p>
      </>
    ),
  },
  {
    title: "What's stored in your browser",
    body: (
      <>
        <p>
          Your chats are saved in your browser&apos;s localStorage so they&apos;re still there
          when you come back. That includes your messages, the replies, your chat history list
          and which chat you had open. Your theme, accent color and sound settings are saved
          there too. It&apos;s stored as plain text, so anyone using this browser profile can
          read it.
        </p>
        <p>To delete it:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Open Settings in the chat sidebar and choose <strong>Clear all chats</strong>.
          </li>
          <li>Delete a single chat from your history with its trash icon.</li>
          <li>Or clear this site&apos;s data in your browser settings.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Hosting and abuse protection",
    body: (
      <>
        <p>
          The site is hosted on Vercel, which processes standard request data such as your IP
          address to serve pages.
        </p>
        <p>
          To limit abuse of the chat, my server counts requests per IP address in memory over a
          10-minute window. Those counts aren&apos;t written to storage and reset whenever the
          server restarts. When you send a message, Vercel BotID also runs a check in your
          browser and on the server to tell people from bots.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and tracking",
    body: (
      <p>
        There are no ads, no analytics and no tracking cookies. The only cookie my code sets is
        one that picks which AI model the chat uses, and it&apos;s only set for me through a
        password-protected admin page.
      </p>
    ),
  },
  {
    title: "Booking and email",
    body: (
      <p>
        The booking links open Cal.com, which handles anything you enter there. If you email
        me, the message goes to my inbox.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <SitePageShell secondaryHref="/consulting" secondaryLabel="Consulting">
      <article className="space-y-10 pb-16">
        <header className="space-y-3">
          <p className="eyebrow text-xs text-[var(--muted)]">Privacy</p>
          <h1 className={`text-4xl tracking-[-0.04em] sm:text-5xl ${serif}`}>Privacy</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            What happens to what you type in the chat, in plain terms.
          </p>
          <p className="text-xs text-[var(--muted)]">Last updated October 2026</p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className={`text-2xl tracking-[-0.03em] sm:text-3xl ${serif}`}>{section.title}</h2>
            <div className="max-w-2xl space-y-3 text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
              {section.body}
            </div>
          </section>
        ))}

        <section className="space-y-3 rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-6">
          <h2 className={`text-2xl tracking-[-0.03em] sm:text-3xl ${serif}`}>Questions</h2>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Email me at{" "}
            <a
              href={`mailto:${SITE.email}`}
              className="text-[var(--foreground)] underline-offset-4 hover:underline"
              data-cuelume-hover="whisper"
              data-cuelume-press="tick"
            >
              {SITE.email}
            </a>
            .
          </p>
        </section>
      </article>
    </SitePageShell>
  );
}
