import type { Metadata } from "next";
import { SitePageShell } from "@/components/site-page-shell";
import { SITE } from "@/data/site";
import { OG_MEDIA } from "@/lib/og";

const serif =
  "font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif]";

const description =
  "How the chat on this site handles what you type: who processes it, what's stored, and for how long.";

export const metadata: Metadata = {
  title: "Privacy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy",
    description,
    url: "/privacy",
    ...OG_MEDIA,
  },
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "What happens to your messages",
    body: (
      <>
        <p>
          When you send a message, the recent messages in that chat (up to the last 20) go to my
          server and, unless the check below blocks them, on to the AI model provider that writes
          the reply: OpenAI or Anthropic, depending on which model I have the chat set to. The
          first message of a new chat is also sent to generate a short title for it, unless that
          message was blocked. The providers
          handle that data under their API terms.
        </p>
        <p>
          Before a reply is written, the same messages may also go to TypeSafe. Their model, Jev,
          does not write the reply. It checks the latest message for spam, attempts to override
          the assistant, and requests for harmful or illegal help, and it scores the chat: how
          well it fits the work I do, and whether to suggest a discovery call or an email. If
          that check blocks a message, the message is not sent to OpenAI or Anthropic. When
          TypeSafe is not configured, this check is skipped.
        </p>
        <p>
          I save a copy of each chat, your messages and the assistant&apos;s replies, in my
          database (hosted by Convex), so I can see what&apos;s useful and where the assistant
          falls short. Saved chats are deleted automatically after 90 days, and so are the block
          and the fit score stored with a chat. They aren&apos;t
          linked to your name or email unless you leave your email on a brief. If you leave your
          email, the fit score at that moment is saved with it. If you&apos;d like
          a chat deleted sooner, email me.
        </p>
        <p>Please don&apos;t share sensitive information, such as patient or customer details.</p>
      </>
    ),
  },
  {
    title: "Ratings and feedback",
    body: (
      <p>
        If you rate a reply with the thumbs up or down, I save the rating, any reason or comment
        you add, the reply and the message it answered. Feedback is deleted after 90 days too.
      </p>
    ),
  },
  {
    title: "Usage analytics",
    body: (
      <>
        <p>
          To learn what works, I record a few events: that the chat page loaded, that a chat
          started, that the assistant wrote a brief, clicks on the booking and email links, and
          which suggested question you sent if you used one. With them I keep the headline you
          saw, the website that sent you here (just its
          domain), any campaign tags in the link, and whether you&apos;re on a phone, tablet or
          desktop. A random id, kept in your browser tab until you close it, ties one visit&apos;s
          events together. These events are deleted after 90 days.
        </p>
        <p>
          Vercel Web Analytics also counts page views. It doesn&apos;t use cookies and doesn&apos;t
          store your IP address.
        </p>
      </>
    ),
  },
  {
    title: "Leaving your email",
    body: (
      <p>
        If you leave your email on your brief, I save it with your name (if you give it), the
        brief and the chat it came from, so I can follow up, and I may get an email about it. I
        keep it until you ask me to delete it or I no longer need it. I won&apos;t add you to a
        mailing list or share it.
      </p>
    ),
  },
  {
    title: "What's stored in your browser",
    body: (
      <>
        <p>
          Your chats are saved in your browser&apos;s localStorage so they&apos;re still there
          when you come back. That includes your messages, the replies (including any brief
          the assistant writes for you), your recent chats list and which chat you had open.
          Your theme and sound settings are saved there too. It&apos;s stored as plain text, so
          anyone using this browser profile can read it. The visit id above is kept in
          sessionStorage and is gone when you close the tab.
        </p>
        <p>To delete what&apos;s in your browser:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Open the <strong>Menu</strong> on the chat and choose <strong>Clear all chats</strong>.
          </li>
          <li>Delete a single chat from Recent chats in the Menu with its trash icon.</li>
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
          address to serve pages. I don&apos;t store IP addresses.
        </p>
        <p>
          To limit abuse, my server counts requests per IP address in memory over a short
          window. Those counts aren&apos;t written to storage and reset whenever the server
          restarts. When you send a message, rate a reply or leave your email, Vercel BotID also
          runs a check in your browser and on the server to tell people from bots. The TypeSafe
          check described above is what stops a message that looks like spam, a jailbreak or
          abuse before a reply is written.
        </p>
      </>
    ),
  },
  {
    title: "Cookies",
    body: (
      <p>
        There are no ads and no tracking cookies. The only cookies my code sets are for me: one
        that signs me in to a password-protected admin page, and one that picks which AI model
        the chat uses in my own browser.
      </p>
    ),
  },
  {
    title: "Booking and email",
    body: (
      <>
        <p>
          The booking links open Cal.com, which handles anything you enter there. If you email
          me, the message goes to my inbox.
        </p>
        <p>
          The booking button puts your brief in the notes on the Cal.com booking page, and the
          email button puts it in a new email in your own mail app. You can edit it first.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <SitePageShell>
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
