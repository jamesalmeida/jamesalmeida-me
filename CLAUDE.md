# CLAUDE.md — Context for AI Coding Agents

This file gives you (Claude, Codex, or any other coding agent) the critical context needed to work on this repo without breaking things.

## What This Is

**jamesalmeida.me** — James Almeida's personal portfolio site built as a full-screen AI chat interface. Visitors can chat with an assistant that speaks *about* James (third person) to learn about his work, experience, projects, and how to contact him.

- **Live URL**: https://jamesalmeida.me
- **Repo**: https://github.com/jamesalmeida/jamesalmeida-me
- **Deploy**: Vercel project `jamesalmeida.me` (team: `generalsystemsventures`)
- **PRD**: See [`PRD.md`](./PRD.md) for full product spec

## Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind v4, `@assistant-ui/react` for chat primitives
- **AI**: Vercel AI SDK v5 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- **Default Model**: Claude Sonnet 4.5 (switchable via admin panel)
- **Persistence**: localStorage only (no database for MVP)
- **Node**: 22.x (see `.nvmrc`)

## ⚠️ CRITICAL: Dependency Version Lock

**DO NOT upgrade these packages without running `npm run build` locally first:**

```json
"@assistant-ui/react": "0.11.58",
"@assistant-ui/react-ai-sdk": "1.1.21",
"ai": "^5.0.33",
"@ai-sdk/react": "^2.0.39"
```

### Why these exact versions?

- `@assistant-ui/react-ai-sdk@1.2+` requires `ai@^6.0.138` which **does not exist on npm yet** (bleeding-edge unreleased)
- `@assistant-ui/react-ai-sdk@1.1.21` is the latest stable version compatible with `ai@5`
- `@assistant-ui/react@0.12+` changes the internal `@assistant-ui/tap` API (missing `withKey` export)
- `@assistant-ui/react@0.11.58` is the last version that works with `@assistant-ui/react-ai-sdk@1.1.21`

### Correct v5 API

```tsx
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { DefaultChatTransport, type UIMessage } from "ai";

const runtime = useChatRuntime({
  messages: initialMessages,  // NOT initialMessages (v4 name)
  transport: new DefaultChatTransport({ api: "/api/chat" }),
});
```

**DO NOT use:**
- `useChat` from `ai/react` — removed in v5
- `useChat({ api: "/api/chat" })` — the `api` option was removed in v5
- `useChat({ initialMessages })` — renamed to `messages` and requires transport
- `@assistant-ui/react-ai-sdk@1.2+` — requires unreleased `ai@6`

## Architecture

```
app/
  api/
    chat/route.ts          # POST handler, streams via ai SDK streamText
    admin/
      model/route.ts       # GET/POST for admin model selection
      verify/route.ts      # POST for admin password verification
  admin/page.tsx           # Password-gated admin panel
  page.tsx                 # Main chat page with thread sidebar
  layout.tsx               # Root layout
  globals.css              # Tailwind v4 + custom CSS vars

components/
  thread.tsx               # Main chat thread (useChatRuntime)
  thread-list.tsx          # Sidebar thread list
  thread-list-item.tsx     # Individual thread item
  suggestions.tsx          # Thread-specific suggestion pills

lib/
  models.ts                # Model registry (shared client/server)
  models.server.ts         # Server-only createModel with API keys
  system-prompt.ts         # AI system prompt builder (3rd person about James)
  context.ts               # Loads data/context.md
  threads.ts               # Pre-seeded thread definitions

data/
  context.md               # James's bio/experience/projects (single source of truth)
  threads/
    projects.json          # Pre-seeded Projects thread messages
    experience.json        # Pre-seeded Experience thread messages
    socials.json            # Pre-seeded Socials thread messages
    resume.json             # Pre-seeded Resume thread messages

public/
  resume.pdf               # Downloadable resume
```

## Environment Variables

Required (set in Vercel dashboard and `.env.local`):

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...        # optional, only if using OpenAI models
ADMIN_PASSWORD=...                 # for admin panel access
DEFAULT_MODEL=claude-sonnet-4-5    # optional override
```

## Key Rules

### Persona
- The assistant speaks **about** James in **3rd person** — NOT as James
- System prompt in `lib/system-prompt.ts` enforces this
- Example: "James built Sheldn.ai in 2024" ✅ / "I built Sheldn.ai in 2024" ❌

### Persistence
- Pre-seeded thread messages load from `data/threads/*.json` at runtime
- User-added messages stored in `localStorage` per thread
- Rendered as `[...baseMessages, ...userMessages]`
- **Never** persist to a database — localStorage only for MVP

### Thread-Specific UI
- Each pre-seeded thread has unique suggestion pills (see `components/suggestions.tsx`)
- Projects: Sheldn.ai, Society6, iROKOtv, Datadog
- Experience: AI Consulting, xAI, Society6, Earlier Career
- Socials: Email, LinkedIn, GitHub, Consulting Inquiry
- Resume: Download Resume, Recent Roles, Key Skills, Consulting Focus

### Admin Panel
- Route: `/admin` (password-gated)
- Password checked via `POST /api/admin/verify` using `ADMIN_PASSWORD` env var
- Selected model stored in cookie `jamesalmeida-model`
- Chat route reads cookie on each request

## Before You Commit

**ALWAYS run the build locally first:**

```bash
npm run build
```

Vercel's build is **stricter** than `next dev`:
- Full TypeScript type checking
- Strict ESLint rules
- Static analysis of imports/exports
- No dynamic `api/rsc` paths

If `npm run dev` works but `npm run build` fails, fix the build errors **before** pushing. Do not rely on Vercel CI to catch type errors.

## Testing Changes

```bash
# Install deps (use the exact lockfile)
npm install

# Type check only
npm run typecheck

# Full production build (catches everything Vercel will)
npm run build

# Run dev server
npm run dev
```

## Troubleshooting

### "withKey is not exported from @assistant-ui/tap"
You upgraded `@assistant-ui/react` past `0.11.58`. Revert.

### "No matching version found for ai@6.x.x"
You upgraded `@assistant-ui/react-ai-sdk` past `1.1.21`. Revert.

### "Package path ./react is not exported from package ai"
You used `import { useChat } from "ai/react"` — that was removed in v5. Use `useChatRuntime` from `@assistant-ui/react-ai-sdk` instead.

### "'initialMessages' does not exist in type"
The v5 API renamed this to `messages`. Use `useChatRuntime({ messages: initialMessages, transport: ... })`.

### Vercel build fails but localhost works
Run `npm run build` locally. Dev mode (`next dev`) skips strict type checking; production build catches everything.

## History of Pain

This repo went through significant dependency hell during initial setup:

1. Started with `@assistant-ui/react@0.12` + `react-ai-sdk@1.3.16` → hit `withKey` not exported
2. Tried downgrading `ai` to v4 → broke the API surface
3. Tried `ai/react` import → removed in v5
4. Tried `@ai-sdk/react` useChat with `initialMessages` → renamed to `messages`
5. **Final fix**: Pin `@assistant-ui/react@0.11.58` + `react-ai-sdk@1.1.21` + `ai@5.0.33` + use `useChatRuntime` with `DefaultChatTransport`

**Lesson**: Always check peer dependencies and `npm view <pkg>@<version> dependencies` before upgrading `@assistant-ui/*` packages. The 1.3.x line requires unreleased `ai@6`.
