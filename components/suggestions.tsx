"use client";

import { useComposerRuntime } from "@assistant-ui/react";
import { Mail } from "lucide-react";
import { getProjects } from "@/data/portfolio";
import { OFFER, SITE } from "@/data/site";
import type { StaticThreadId } from "@/lib/threads";
import { BookingButton, BookingCard } from "./booking-button";

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

type Suggestion = {
  title: string;
  prompt: string;
};

type ThreadSuggestions = {
  title: string;
  subtitle: string;
  description?: string;
  suggestions: Suggestion[];
};

const featuredSuggestions: Suggestion[] = getProjects("featured").map((project) => ({
  title: project.name,
  prompt: `Tell me about ${project.name}.`,
}));

const THREAD_SUGGESTIONS: Record<StaticThreadId, ThreadSuggestions> = {
  "new-chat": {
    title: "General Chat",
    subtitle: "Ask me anything.",
    suggestions: [
      {
        title: "Who are you?",
        prompt: "Who are you?",
      },
      {
        title: "How can you help my business?",
        prompt: "What could you automate for a small business like mine?",
      },
      {
        title: "Show me your portfolio",
        prompt: "Show me your portfolio",
      },
      {
        title: "What does it cost?",
        prompt: "What does it cost?",
      },
    ],
  },
  "work-with-me": {
    title: "Work with me",
    subtitle: "Get your team's hours back.",
    description: `${OFFER.audienceLine} Most often: ${OFFER.audience.map((a, i) => (i === 0 ? a : a.toLowerCase())).join(", ")}.`,
    suggestions: [
      {
        title: "Who do you work with?",
        prompt: "Who do you work with?",
      },
      {
        title: "How does it work?",
        prompt: "How does it work?",
      },
      {
        title: "What does it cost?",
        prompt: "What does it cost?",
      },
      {
        title: "Example: dental office",
        prompt: "I run a dental office. What could you automate?",
      },
      {
        title: "Example: property manager",
        prompt: "I manage properties. What could you automate?",
      },
      {
        title: "I'd like to book a call",
        prompt: "I'd like to book a call",
      },
    ],
  },
  projects: {
    title: "Portfolio",
    subtitle: "Projects I've designed and shipped.",
    suggestions: [
      ...featuredSuggestions,
      {
        title: "Earlier work",
        prompt: "Tell me about your earlier work.",
      },
    ],
  },
  experience: {
    title: "Experience",
    subtitle: "My career across AI, product, and frontend engineering.",
    suggestions: [
      {
        title: "AI Consulting",
        prompt: "What does your AI consulting work look like?",
      },
      {
        title: "xAI Experience",
        prompt: "What did you work on as an AI Trainer at xAI?",
      },
      {
        title: "Society6 Engineering",
        prompt: "What did you build as a Software Engineer at Society6?",
      },
      {
        title: "Earlier Career",
        prompt: "Tell me about your earlier roles at iROKOtv and Datadog.",
      },
    ],
  },
  socials: {
    title: "Contact",
    subtitle: "Book a free intro call or email me.",
    suggestions: [
      {
        title: "Consulting Inquiry",
        prompt: "I have a project I'd like to discuss. How should I reach out?",
      },
    ],
  },
  resume: {
    title: "Resume",
    subtitle: "Download or explore my experience.",
    suggestions: [
      {
        title: "Download Resume",
        prompt: "Can I download your resume as a PDF?",
      },
      {
        title: "Recent Roles",
        prompt: "What are your most recent positions?",
      },
      {
        title: "Key Skills",
        prompt: "What are your core technical skills?",
      },
      {
        title: "Consulting Focus",
        prompt: "What kind of businesses do you consult for?",
      },
    ],
  },
};

const linkButtonClass =
  "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2.5 text-sm text-[var(--foreground)] transition hover:-translate-y-px hover:border-[var(--border-strong)]";

interface SuggestionsProps {
  threadId?: string;
}

export function Suggestions({ threadId = "new-chat" }: SuggestionsProps) {
  const composer = useComposerRuntime();
  const config = Object.hasOwn(THREAD_SUGGESTIONS, threadId)
    ? THREAD_SUGGESTIONS[threadId as StaticThreadId]
    : THREAD_SUGGESTIONS["new-chat"];

  const handleClick = (prompt: string) => {
    composer.setText(prompt);
    composer.send();
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-2 sm:gap-6 sm:py-10">
      <div className="space-y-3">
        <p className="eyebrow text-xs text-[var(--muted)]">{config.title}</p>
        <h2 className="max-w-xl font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',Georgia,serif] text-3xl leading-tight tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
          {config.subtitle}
        </h2>
        {config.description ? (
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            {config.description}
          </p>
        ) : null}
      </div>
      {threadId === "socials" ? (
        <div className="flex flex-wrap items-center gap-2">
          <BookingButton />
          <a
            href={`mailto:${SITE.email}`}
            className={linkButtonClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            <Mail size={16} />
            Email {SITE.email}
          </a>
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={linkButtonClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            <LinkedinIcon size={16} />
            LinkedIn
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className={linkButtonClass}
            data-cuelume-hover="whisper"
            data-cuelume-press="tick"
          >
            <GithubIcon size={16} />
            GitHub
          </a>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {config.suggestions.map((suggestion) => (
          <button
            key={suggestion.prompt}
            onClick={() => handleClick(suggestion.prompt)}
            className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-left transition duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] hover:bg-[var(--panel-strong)]"
            data-cuelume-press="tick"
          >
            <div className="text-sm font-medium">{suggestion.title}</div>
            {suggestion.prompt !== suggestion.title ? (
              <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {suggestion.prompt}
              </div>
            ) : null}
          </button>
        ))}
      </div>
      {threadId === "work-with-me" ? <BookingCard /> : null}
    </div>
  );
}
