# PRD: jamesalmeida.me — AI Chat Portfolio Site

**Status:** Draft v2
**Last Updated:** 2026-04-09
**Author:** James + Tersono

---

## 1. Overview

A personal portfolio/website at **jamesalmeida.me** built with **Next.js** and **@assistant-ui/react** as the core interaction layer. Instead of a traditional static portfolio, visitors interact with a full-screen AI chat interface with a thread-list sidebar that doubles as site navigation. Pre-seeded threads act as "pages" (Projects, Experience, Socials, Resume) while visitors can also start fresh conversations.

---

## 2. Goals

- **Primary:** Create a memorable, interactive personal site powered by AI chat
- **Secondary:** Demonstrate technical skills (Next.js, AI integration, modern React)
- **Tertiary:** Serve as a living portfolio that can be updated by editing a single context document

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router) |
| Chat UI | **@assistant-ui/react** (v0.12.x) — shadcn template |
| Runtime | **Vercel AI SDK** via `@assistant-ui/react-ai-sdk` |
| Styling | **Tailwind CSS v4** |
| LLM Backend | **API route** (`/api/chat`) — multi-provider (OpenAI + Anthropic) |
| LLM Providers | `@ai-sdk/openai` + `@ai-sdk/anthropic` (admin-switchable) |
| Persistence | **localStorage** (visitor chat history) |
| Deployment | **Vercel** (existing repo — overwrite) |
| Source Control | **GitHub** (existing repo) |
| Language | **TypeScript** |
| Design | **Black & white**, minimal, shadcn defaults |

---

## 4. Decisions Log

| # | Decision | Notes |
|---|----------|-------|
| 1 | **Multi-provider LLM with admin toggle** | Start with OpenAI + Anthropic. Admin panel to switch models at runtime. |
| 2 | **Persona: James's AI assistant** | Speaks on James's behalf, not as James. Knows everything in the context doc. |
| 3 | **Single context document** | `/data/context.md` — bio, experience, projects, skills, socials. Loaded into system prompt. Easy to update. |
| 4 | **Overwrite existing repo** | jamesalmeida.me already on Vercel + GitHub. Replace with new Next.js project. |
| 5 | **Black & white MVP** | Minimal design. shadcn template out of the box. Polish later. |
| 6 | **Full-screen chat with thread-list nav** | Thread list sidebar = site navigation. Pre-seeded threads = pages. |
| 7 | **localStorage for persistence** | All chat history (user threads + pre-seeded thread additions) stored client-side. |
| 8 | **Pre-seeded threads are interactive** | Visitors can continue chatting in any pre-seeded thread. Base messages from repo, user additions in localStorage. |

---

## 5. Core Features

### 5.1 Chat Interface

Built on `@assistant-ui/react` shadcn template:

| Feature | Detail |
|---------|--------|
| **Message bubbles** | User & assistant with distinct styling (black/white theme) |
| **Streaming text** | Real-time token streaming via AI SDK runtime |
| **Input box + send** | Composer with send button, Enter to send |
| **Suggestion pills** | Shown on empty "New Chat" thread |
| **Markdown rendering** | Code blocks, links, bold/italic in responses |
| **Thread list sidebar** | Left panel with pre-seeded + user threads |

### 5.2 Thread-List as Navigation

The sidebar thread list serves as both chat history and site navigation:

```
┌─────────────────┬──────────────────────────────┐
│  THREAD LIST     │                              │
│                  │    (active thread content)   │
│  💬 New Chat     │                              │
│   ← default      │    Welcome! I'm James's AI   │
│                  │    assistant. Ask me anything │
│  ─────────────   │    about his work...         │
│  📁 PRE-SEEDED   │                              │
│                  │    [Who is James?]            │
│  📂 Projects     │    [Show me projects]        │
│  💼 Experience   │    [Tech stack]              │
│  🔗 Socials      │                              │
│  📄 Resume       │                              │
│                  │   ┌────────────────────────┐ │
│                  │   │ Type a message...  [→] │ │
│                  │   └────────────────────────┘ │
└─────────────────┴──────────────────────────────┘
```

**Thread behavior:**
- **New Chat** — Always at top. Fresh conversation. Default on first visit.
- **Pre-seeded threads** (Projects, Experience, Socials, Resume) — Pre-populated with rich assistant messages (project cards, work timeline, links). Visitors can ask follow-ups.
- **All threads** are interactive and persistent via localStorage.
- **Mobile** — Thread list becomes hamburger/drawer.

### 5.3 Pre-Seeded Thread Content

| Thread | Pre-populated Content |
|--------|-----------------------|
| **Projects** | Cards for each project (Sheldn.ai, Society6 Artist Studio, iROKOtv rebuild, Datadog rebrand, etc.) with descriptions, tech used, links |
| **Experience** | Work history timeline — GSV, xAI, Leaf Group, iROKOtv, Datadog, NYCDA, SBG, Nooka |
| **Socials** | LinkedIn, GitHub, email, any other links |
| **Resume** | Formatted resume content + PDF download link |

### 5.4 Suggestion Pills (New Chat)

Shown on empty thread:
- "Who is James?"
- "Show me your projects"
- "What's your tech stack?"
- "How can I work with you?"

### 5.5 Admin Panel

Hidden admin route (`/admin` or toggle) for James to:
- **Switch LLM provider/model** — dropdown: GPT-4o, GPT-4o-mini, Claude Sonnet, Claude Haiku, etc.
- **Auth** — simple password or env-based token (no full auth system for MVP)
- Model selection stored in a cookie/env variable that the API route reads

### 5.6 Context Document

A single markdown file in the repo that contains everything the AI needs to know:

```
/data/context.md

# James Almeida — AI Context

## Bio
...

## Experience
### AI Consultant @ General Systems Ventures (2025–Present)
...
### Human Data Specialist @ xAI (2024–2025)
...
(etc.)

## Projects
### Sheldn.ai
...

## Skills
...

## Socials & Contact
...
```

This gets loaded at build time or runtime and injected into the system prompt. To update what the AI knows, James just edits this file and deploys.

---

## 6. Data & Storage Architecture

### localStorage Structure

```typescript
interface StoredThreads {
  [threadId: string]: {
    // User-added messages (appended after pre-seeded base)
    userMessages: Message[];
    lastVisited: number; // timestamp
    createdAt: number;   // timestamp
  };
}

// Key: "jamesalmeida-threads"
// Pre-seeded base messages loaded from /data/threads/*.json
// User additions stored in localStorage
// Render = [...baseMessages, ...userMessages]
```

### System Prompt Construction

```typescript
// /lib/system-prompt.ts
const systemPrompt = `
You are James Almeida's AI assistant on his personal website.
You help visitors learn about James's work, experience, and projects.
You speak warmly and knowledgeably about James, but you are his assistant, not James himself.

${contextDocument} // loaded from /data/context.md

Guidelines:
- Be concise but thorough
- Share links when relevant
- If asked something not in your context, say so honestly
- Keep responses conversational and engaging
- You can suggest other threads/topics the visitor might be interested in
`;
```

---

## 7. File Structure

```
jamesalmeida.me/
├── app/
│   ├── layout.tsx                # Root layout, fonts, metadata
│   ├── page.tsx                  # Main page — full-screen chat
│   ├── admin/
│   │   └── page.tsx              # Admin panel (model switcher)
│   └── api/
│       └── chat/
│           └── route.ts          # AI SDK streaming endpoint (multi-provider)
├── components/
│   ├── assistant.tsx             # AssistantRuntimeProvider wrapper
│   ├── thread.tsx                # Custom Thread (shadcn base)
│   ├── thread-list.tsx           # Thread list with pre-seeded entries
│   ├── suggestions.tsx           # Suggestion pills
│   ├── message.tsx               # Message bubble styling
│   └── project-card.tsx          # Rich project card for inline display
├── lib/
│   ├── system-prompt.ts          # System prompt builder
│   ├── context.ts                # Loads /data/context.md
│   ├── providers.ts              # Multi-provider LLM config
│   ├── threads.ts                # Thread management (localStorage + base)
│   └── admin.ts                  # Admin auth + model selection
├── data/
│   ├── context.md                # Everything about James (AI knowledge base)
│   └── threads/
│       ├── projects.json         # Pre-seeded Projects thread messages
│       ├── experience.json       # Pre-seeded Experience thread messages
│       ├── socials.json          # Pre-seeded Socials thread messages
│       └── resume.json           # Pre-seeded Resume thread messages
├── public/
│   └── resume.pdf                # Downloadable resume
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 8. Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Scaffold Next.js 15 project with `npx assistant-ui@latest create` (shadcn template)
- [ ] Configure black & white theme (Tailwind)
- [ ] Set up `/api/chat` route with OpenAI (default) + Anthropic support
- [ ] Create `/data/context.md` with James's full context
- [ ] Build system prompt that injects context
- [ ] Implement thread list with pre-seeded threads
- [ ] Create pre-seeded thread data (Projects, Experience, Socials, Resume)
- [ ] localStorage persistence for all threads
- [ ] Suggestion pills on empty New Chat
- [ ] Admin route for model switching
- [ ] Mobile responsive (thread list → drawer)
- [ ] Deploy to Vercel (overwrite existing repo)

### Phase 2: Polish
- [ ] Rich project cards (rendered inline in chat)
- [ ] Custom message styling refinements
- [ ] Loading/typing indicators
- [ ] SEO metadata + Open Graph tags
- [ ] Rate limiting on API route (prevent abuse)
- [ ] Analytics (simple — page views + chat engagement)
- [ ] Error handling (API failures, rate limits)

### Phase 3: Enhancements (Future)
- [ ] Tool use — assistant can render structured UI (project cards, timelines)
- [ ] Dark/light mode toggle
- [ ] Voice input (built-in assistant-ui dictation)
- [ ] Server-side persistence (Vercel KV or Assistant Cloud) for cross-device
- [ ] Visitor analytics — what do people ask most?
- [ ] Custom model fine-tuning on James's writing style
- [ ] More pre-seeded threads as content grows

---

## 9. Dependencies

| Package | Purpose |
|---------|---------|
| `next` (v15) | Framework |
| `@assistant-ui/react` | Chat UI primitives |
| `@assistant-ui/react-ai-sdk` | AI SDK runtime integration |
| `@assistant-ui/react-ui` | shadcn styled components |
| `ai` | Vercel AI SDK core |
| `@ai-sdk/openai` | OpenAI provider |
| `@ai-sdk/anthropic` | Anthropic provider |
| `tailwindcss` | Styling |
| `tailwindcss-animate` | Animations |

---

## 10. API Route: Multi-Provider Design

```typescript
// /app/api/chat/route.ts (pseudocode)

import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { getSystemPrompt } from "@/lib/system-prompt";
import { getActiveModel } from "@/lib/providers";

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Admin-configured model (stored in cookie/env)
  const model = getActiveModel(); 
  // e.g., openai("gpt-4o") or anthropic("claude-sonnet-4-20250514")
  
  const result = streamText({
    model,
    system: getSystemPrompt(),
    messages,
  });
  
  return result.toUIMessageStreamResponse();
}
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_PASSWORD=...          # Simple admin auth
DEFAULT_MODEL=claude-sonnet-4-6   # Default model
```

---

## 11. Success Criteria

- [ ] Visitor lands on site → sees full-screen chat with thread list
- [ ] Thread list shows "New Chat" + pre-seeded threads
- [ ] Clicking a pre-seeded thread shows rich pre-populated content
- [ ] Visitor can chat in any thread and follow-ups stream in real-time
- [ ] Chat history persists across page refreshes (localStorage)
- [ ] Admin can switch models without redeploying
- [ ] Responses are accurate about James's background
- [ ] Mobile experience works (drawer for thread list)
- [ ] Page loads fast (<2s), first token streams in <1s
- [ ] Live at jamesalmeida.me

---

## 12. Resolved Questions

1. ✅ **GitHub repo:** `jamesalmeida/jamesalmeida-me` — overwrite with new project
2. ✅ **Vercel project:** `generalsystemsventures/jamesalmeida.me`
3. ✅ **Default model:** Claude Sonnet 4.6 (`anthropic/claude-sonnet-4-6`)
4. ✅ **Resume PDF:** Hosted at `/public/resume.pdf`, rendered as a download card in the pre-seeded Resume thread

## 13. Open Questions

_(None currently — ready to build)_

---

*This is a living document. Update as decisions are made.*
