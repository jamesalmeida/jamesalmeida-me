# CLAUDE.md — Context for AI Coding Agents

This file gives you (Claude, Codex, or any other coding agent) the critical context needed to work on this repo without breaking things.

## What This Is

**jamesalmeida.me** — James Almeida's portfolio and AI-consulting lead tool. The chat speaks in first person as James. Visitors can also read `/consulting` and `/work` without chatting.

- **Production**: https://www.jamesalmeida.me (apex redirects to www)
- **Repo**: https://github.com/jamesalmeida/jamesalmeida-me
- **Deploy**: Vercel project `jamesalmeida-portfolio` on team GSV (slug `gsv-2`). Branch previews are created automatically and protected by Vercel Authentication.
- **Node**: 24 on Vercel (see `.nvmrc`)
- **PRD**: See [`PRD.md`](./PRD.md) for the original product spec. This file and `data/` are the current source of truth.

## Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind v4, `@assistant-ui/react` for chat primitives
- **AI**: Vercel AI SDK v5 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- **Default Model**: `gpt-5.4` unless `DEFAULT_MODEL` is a known id. A signed admin cookie overrides that.
- **Persistence**: localStorage only (no database)
- **Node**: 24 (see `.nvmrc`)

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

Routes: `/`, `/consulting`, `/work`, `/admin`, `/api/chat`, `/api/generate-title`, `/api/admin/model`. There is no `/api/admin/verify`.

```
app/
  api/chat/route.ts            # POST, sanitized messages, streamText + tools
  api/generate-title/route.ts  # short title for a forked history thread
  api/admin/model/route.ts     # GET current model; POST password + signed cookie
  admin/page.tsx               # Password-gated model switcher (noindex)
  page.tsx                     # Server page; chat hydrates over a static intro
  consulting/page.tsx          # Offer page, rendered from OFFER
  work/page.tsx                # Portfolio page, rendered from PROJECTS
  opengraph-image.tsx          # next/og image
  sitemap.ts / robots.ts
  layout.tsx                   # metadata, JSON-LD
  globals.css

components/
  chat-app.tsx                 # Client chat shell
  static-intro.tsx             # SSR fallback while localStorage hydrates
  thread.tsx                   # Chat thread, header booking CTA, tool UIs
  tool-cards.tsx               # showBookingCta / showPortfolio cards
  suggestions.tsx              # Empty-state pills
  thread-list.tsx              # Sidebar, including links to /consulting and /work

lib/
  system-prompt.ts             # First-person persona + guardrails
  context.ts                   # knowledge.md + generated offer and portfolio
  chat-tools.ts                # showBookingCta, showPortfolio
  sanitize-messages.ts         # Untrusted chat body → last 20 UIMessages
  admin-cookie.ts              # HMAC-signed model cookie
  message-convert.ts           # assistant-ui messages → UIMessage (keeps tools)
  threads.ts                   # Thread ids; base messages are empty

data/
  knowledge.md                 # Bot knowledge. Placeholders {{email}} etc.
  site.ts                      # SITE + OFFER. Client-safe. No secrets.
  portfolio.ts                 # PROJECTS. `confirmed` is never rendered.

public/
  resume.pdf
scripts/
  eval-chat.mjs                # npm run eval
  eval-cases.json
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
- The assistant and the pages speak **as James in first person** ("I" / "my")
- Example: "I built Sheldn.ai" ✅ / "James built Sheldn.ai" ❌
- General Systems Ventures / GSV is only for contracts and billing (and, on the resume, where the consulting is contracted). Never "we" as the company. "We'll see" between the visitor and James is fine.
- Public contact is only `james@gsv.to`, LinkedIn, and GitHub. No phone number. Never state how long the intro call is. The CTA label is "Book a free intro call".

### Content
- `data/site.ts` exports `SITE` and `OFFER`. Pages and the bot both use `OFFER`. Do not copy prices into page copy.
- `data/portfolio.ts` exports `PROJECTS`. Never render `confirmed`.
- `data/knowledge.md` is the swappable bio. `lib/context.ts` strips HTML comments, fills `{{email}}`, `{{bookingUrl}}`, `{{linkedin}}`, `{{github}}`, `{{resumeUrl}}` from `SITE`, then appends offer and portfolio markdown.
- Provisional business decisions are one value plus a `// PROVISIONAL:` comment in `.ts`, or `<!-- // PROVISIONAL: ... -->` in `.md`. Find them with `rg "PROVISIONAL"`. Comments are stripped before the model sees the knowledge, so that word must not reach the prompt.

### Persistence
- Seeded threads have empty `baseMessages`. User messages live in `localStorage` per thread.
- Tool cards are kept: `lib/message-convert.ts` turns completed assistant-ui tool calls into `tool-*` parts with `state: "output-available"`. `@assistant-ui/react-ai-sdk` 1.1.21 converts those back into tool-call parts on reload.
- **Never** persist chats to a database.

### Chat tools and abuse caps
- `showBookingCta` renders a booking card from `SITE` (buying intent, contact, timing). `showPortfolio` renders project cards (public fields only).
- `POST /api/chat` rejects bodies over 200 KB (413) and bad JSON (400). `sanitizeMessages` drops system roles and unknown parts, keeps the last 20 user/assistant messages, truncates each text part to 2,000 characters, and requires the last message to be from the user.
- `streamText` uses `stopWhen: stepCountIs(3)` and `maxOutputTokens: 800`.
- `POST /api/generate-title` rejects bodies over 10 KB and truncates the message to 500 characters.

### Admin panel
- Route: `/admin` (noindex). Password is checked on `POST /api/admin/model` with a timing-safe compare against `ADMIN_PASSWORD`. There is no `/api/admin/verify`.
- On success the route sets httpOnly cookie `jamesalmeida-model` to `${model}.${base64url HMAC-SHA256}`. Unsigned or unknown cookies are ignored and the default model is used.
- The admin page loads the current model from `GET /api/admin/model` because the cookie is not readable in the browser.
- Chat and title routes both use `resolveAdminModel`.

### Eval
Needs a running server and API keys (not available in every environment):

```bash
EVAL_BASE_URL=http://localhost:3000 EVAL_COOKIE='...' npm run eval
```

`EVAL_ONLY=pricing,jailbreak` runs a subset. Results land in `scripts/eval-results.json` (gitignored). The script exits 1 on any failure.

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
