"use client";

import { useComposerRuntime } from "@assistant-ui/react";
import type { ThreadId } from "@/lib/threads";

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

const THREAD_SUGGESTIONS: Record<ThreadId, ThreadSuggestions> = {
  "new-chat": {
    title: "James Almeida",
    subtitle: "Ask the portfolio anything.",
    description: "This assistant can walk you through James' projects, work history, technical strengths, and how to get in touch.",
    suggestions: [
      {
        title: "Who is James?",
        prompt: "Who is James Almeida, and what kind of work does he do?",
      },
      {
        title: "Show me projects",
        prompt: "Show me the projects that best represent James' work.",
      },
      {
        title: "What's the tech stack?",
        prompt: "What technologies and skills does James work with most often?",
      },
      {
        title: "How can I work with him?",
        prompt: "What kinds of consulting or product work is James a good fit for?",
      },
    ],
  },
  projects: {
    title: "Projects",
    subtitle: "Explore James' key builds and product work.",
    suggestions: [
      {
        title: "Sheldn.ai",
        prompt: "Tell me about Sheldn.ai and what it does.",
      },
      {
        title: "Society6 Artist Studio",
        prompt: "What was the Society6 Artist Studio rebuild?",
      },
      {
        title: "iROKOtv Rebuild",
        prompt: "Tell me about the iROKOtv frontend rebuild.",
      },
      {
        title: "Datadog Website",
        prompt: "What was your role in rebuilding Datadog's website?",
      },
    ],
  },
  experience: {
    title: "Experience",
    subtitle: "James' career across AI, product, and frontend engineering.",
    suggestions: [
      {
        title: "AI Consulting",
        prompt: "What kind of AI consulting work do you do at General Systems Ventures?",
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
    title: "Connect",
    subtitle: "Get in touch with James.",
    suggestions: [
      {
        title: "Email",
        prompt: "What's the best email to reach you at?",
      },
      {
        title: "LinkedIn",
        prompt: "Can you share your LinkedIn profile?",
      },
      {
        title: "GitHub",
        prompt: "Where can I find your GitHub?",
      },
      {
        title: "Consulting Inquiry",
        prompt: "I have a project I'd like to discuss. How should I reach out?",
      },
    ],
  },
  resume: {
    title: "Resume",
    subtitle: "Download or explore James' experience.",
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
        prompt: "What kind of AI consulting do you specialize in?",
      },
    ],
  },
};

interface SuggestionsProps {
  threadId?: ThreadId;
}

export function Suggestions({ threadId = "new-chat" }: SuggestionsProps) {
  const composer = useComposerRuntime();
  const config = THREAD_SUGGESTIONS[threadId];

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
        {config.description && (
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            {config.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {config.suggestions.map((suggestion) => (
          <button
            key={suggestion.prompt}
            onClick={() => handleClick(suggestion.prompt)}
            className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-left transition duration-200 hover:-translate-y-px hover:border-black/30 hover:bg-white"
          >
            <div className="text-sm font-medium">{suggestion.title}</div>
            <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {suggestion.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
