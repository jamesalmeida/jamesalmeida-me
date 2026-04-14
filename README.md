# jamesalmeida.me

A full-screen AI chat portfolio. Instead of a static page, visitors explore projects, experience, socials, and resume through a chat interface powered by Claude.

**Live:** [jamesalmeida.me](https://jamesalmeida.me)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Chat UI | `@assistant-ui/react` + `@assistant-ui/react-ai-sdk` |
| AI | Vercel AI SDK v5, Anthropic Claude (switchable to OpenAI) |
| Styling | Tailwind CSS v4 |
| Persistence | localStorage (no database) |
| Deploy | Vercel |

## How it works

The sidebar thread list doubles as site navigation. Pre-seeded threads (Projects, Experience, Socials, Resume) load base messages from `data/threads/*.json` and let visitors keep chatting. A General Chat thread handles open-ended questions. All user messages are stored in localStorage.

The assistant speaks **about** James in third person — not as James. Context lives in a single file (`data/context.md`) that feeds the system prompt.

## Project structure

```
app/
  api/chat/route.ts        # Streaming chat endpoint
  api/admin/              # Model selection + auth
  admin/page.tsx          # Password-gated admin panel
  page.tsx                # Main chat page
components/
  thread.tsx              # Chat thread UI
  thread-list.tsx         # Sidebar navigation
  suggestions.tsx         # Empty-state suggestion pills
  theme-provider.tsx      # Light/dark + accent color theming
lib/
  system-prompt.ts        # AI persona + context injection
  threads.ts              # Thread definitions
  models.ts               # Model registry
data/
  context.md              # James' bio, experience, projects (edit this to update the AI)
  threads/                # Pre-seeded thread message starters
```

## Local development

```bash
cp .env.example .env.local   # add your API keys
npm install
npm run dev
```

Required environment variables:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...   # optional
ADMIN_PASSWORD=...
```

## Before pushing

Always run the production build locally — Vercel's build is stricter than `next dev`:

```bash
npm run build
```

## Admin panel

Visit `/admin` to switch the active model at runtime. The selected model is stored in a cookie and read by the chat route on each request.
