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

Routes: `/`, `/consulting`, `/work`, `/privacy`, `/admin`, `/api/chat`, `/api/generate-title`, `/api/admin/model`. There is no `/api/admin/verify`.

```
app/
  api/chat/route.ts            # POST, sanitized messages, streamText + tools
  api/generate-title/route.ts  # short title for a forked history thread
  api/admin/model/route.ts     # GET current model; POST password + signed cookie
  admin/page.tsx               # Password-gated model switcher (noindex)
  page.tsx                     # Server page; chat hydrates over a static intro
  consulting/page.tsx          # Offer page, rendered from OFFER
  work/page.tsx                # Portfolio page, rendered from PROJECTS
  privacy/page.tsx             # Plain-language privacy page (keep claims true to the code)
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
  modal.tsx                    # Native <dialog> (showModal) wrapper for Rename/Settings

lib/
  system-prompt.ts             # First-person persona + guardrails
  context.ts                   # knowledge.md + generated offer and portfolio
  chat-tools.ts                # showBookingCta, showPortfolio
  tool-results.ts              # Tool input schemas + pure output builders (shared)
  sanitize-messages.ts         # Untrusted chat body → last 20 UIMessages
  request-body.ts              # Body size cap (Content-Length, then UTF-8 bytes)
  rate-limit.ts                # In-memory per-IP / global fixed-window limiter
  bot-protection.ts            # Vercel BotID checkBotId() wrapper (403 on bots)
  admin-cookie.ts              # HMAC-signed model cookie
  message-convert.ts           # assistant-ui messages → UIMessage (keeps tools)
  threads.ts                   # Thread ids; base messages are empty

data/
  knowledge.md                 # Bot knowledge. Placeholders {{email}} etc.
  site.ts                      # SITE + OFFER. Client-safe. No secrets.
  portfolio.ts                 # PROJECTS. `confirmed` is never rendered.

public/
  resume.pdf
instrumentation-client.ts      # initBotId() for POST /api/chat and /api/generate-title
next.config.ts                 # wrapped with withBotId
scripts/
  eval-chat.mjs                # npm run eval
  eval-cases.json
  eval-private.example.json    # shape for gitignored eval-private.json

lib/*.test.ts                  # Vitest unit tests (npm test)
test/server-only-stub.ts       # Vitest alias for `server-only`
vitest.config.mts              # `@/` and `server-only` aliases
eslint.config.mjs              # ESLint 9 flat config (next/core-web-vitals + next/typescript)
.github/workflows/ci.yml       # PRs and pushes to main
```

## Environment Variables

Required (set in Vercel dashboard and `.env.local`):

```bash
OPENAI_API_KEY=sk-proj-...        # required: the default model is gpt-5.4
ANTHROPIC_API_KEY=sk-ant-...       # only needed for Claude models
ADMIN_PASSWORD=...                 # for admin panel access
ADMIN_COOKIE_SECRET=...            # optional HMAC key for the admin cookie (falls back to ADMIN_PASSWORD)
DEFAULT_MODEL=gpt-5.4              # optional override; unknown ids fall back to gpt-5.4
```

Model ids live in `lib/models.ts` and `lib/models.server.ts`. Remove a model there before its provider retirement date. A cookie that names a removed id is ignored, and the default is used. `claude-sonnet-4-5` is deprecated by Anthropic and retires 2026-11-30.

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
- `ThreadPersistence` (`components/thread.tsx`) saves only when no run is streaming, and flushes unsaved messages on `pagehide`, `visibilitychange` (hidden) and unmount. `ChatApp.updateStoredThreads` writes localStorage synchronously.
- Caps: 50 history threads (newest kept) and the last 100 messages per thread. Stored messages for history threads not in the list are pruned.
- All localStorage access in `lib/threads.ts` is wrapped in try/catch and never throws. On `QuotaExceededError`, `writeStoredThreads` evicts the oldest half of history threads and retries once; evicted threads are also removed from the sidebar.
- "Clear all chats" in the Settings modal (with a confirm step) calls `clearStoredChats()` in `lib/threads.ts`, which removes the three chat keys and keeps theme/accent/sound prefs. `ChatApp` bumps a generation counter so the old thread remounts and its unmount flush is ignored.
- The composer shows a one-line notice linking to `/privacy`. If you change providers, storage, logging, cookies or abuse protection, update `app/privacy/page.tsx` and that notice to match.
- **Never** persist chats to a database.

### Dialogs and menus
- Modals use `components/modal.tsx`: a native `<dialog>` opened with `showModal()` (focus trap, Escape, top layer), labelled via `aria-labelledby`, closed on backdrop click, and returning focus to the trigger (or `returnFocusRef`). Mount it only while open. Don't build new modals from `div`s.
- The thread options menu (`components/thread.tsx`) follows the ARIA menu-button pattern: `aria-haspopup`/`aria-expanded`/`aria-controls` on the trigger, `role="menu"`/`menuitem`, arrow/Home/End keys, Escape or Tab closes and refocuses the trigger.

### Chat tools and abuse caps
- `showBookingCta` renders a booking card from `SITE` (buying intent, contact, timing). It takes no input. Old stored parts with a `reason` field still validate, because the key is stripped. `showPortfolio` renders project cards (public fields only).
- `POST /api/chat` rejects bodies over 200 KB (413) and bad JSON (400). `sanitizeMessages` drops system roles and unknown parts, keeps the last 20 user/assistant messages, truncates each text part to 2,000 characters, and requires the last message to be from the user.
- Client-sent tool parts are never trusted. `sanitizeMessages` discards their `output`, validates `input` with the schemas in `lib/tool-results.ts` (also used by `lib/chat-tools.ts`), and rebuilds the output with the same pure functions the tools' `execute` uses. Parts are dropped if input is invalid, over 1 KB serialized, has more than 20 ids or ids over 64 chars, or has a malformed `toolCallId`. Max 4 tool parts per message and 8 KB of tool input per request. Assistant text parts are still accepted as sent (2,000-char cap); signing them is not done.
- `streamText` uses `stopWhen: stepCountIs(3)` and `maxOutputTokens: 800`. The system prompt is sent as a system message with `providerOptions.anthropic.cacheControl` (ephemeral) when an Anthropic model is selected. The stream sends no message metadata, so the active model is never exposed to visitors.
- Body limits are in bytes (`lib/request-body.ts`): a `Content-Length` over the limit is rejected before reading, then the UTF-8 length is checked.
- `POST /api/generate-title` rejects bodies over 10 KB and truncates the message to 500 characters. A provider error returns `{ title: null }` (200).

### Abuse protection
- Both model routes run, in order: rate limit → BotID → body parsing.
- `lib/rate-limit.ts` keys on the first `x-forwarded-for` IP, then `x-real-ip`, then `"unknown"`. Limits: `/api/chat` 30 per 10 min per IP plus 600 per hour across all visitors; `/api/generate-title` 20 per 10 min per IP. Over the limit returns 429 JSON with `Retry-After` (seconds). The map is capped (expired entries swept, then oldest evicted). State is **per serverless instance** (cold starts reset it, instances don't share it), which is accepted: no external storage.
- BotID (`botid` package, `basic` check level) is set up in `instrumentation-client.ts` and checked in `lib/bot-protection.ts`. Keep paths and check level in sync. Bots get 403. It returns `isBot: false` in dev. If `checkBotId()` throws (for example, no Vercel OIDC token under a local `next start`), the request is allowed and the error is logged.
- `components/thread.tsx` turns a 429/403 from `/api/chat` into a short friendly error. Title generation failures stay silent.
- Spend caps in the OpenAI and Anthropic dashboards are the backstop.
- Running `npm run eval` against a deployed URL: BotID may 403 requests that come from Node, because they lack the browser's BotID headers. Run it against `npm run dev`.

### Admin panel
- Route: `/admin` (noindex). Password is checked on `POST /api/admin/model` with a timing-safe compare against `ADMIN_PASSWORD`. There is no `/api/admin/verify`. Bad JSON returns 400. Attempts are throttled to 10 per 15 min per IP (`adminIpLimiter`, 429 with `Retry-After`).
- On success the route sets httpOnly cookie `jamesalmeida-model` (30 days) to `${model}.${issuedAtSeconds}.${base64url HMAC-SHA256}`. The key is `ADMIN_COOKIE_SECRET` if set, else `ADMIN_PASSWORD`. No cookie is signed or honoured without `ADMIN_PASSWORD`. Unsigned, unknown-model, old-format and expired (older than 30 days) cookies are ignored, and the default model is used.
- The override only applies to the admin's own browser. Every other visitor gets the default model.
- The admin page loads the current model from `GET /api/admin/model` because the cookie is not readable in the browser.
- Chat and title routes both use `resolveAdminModel`.

### Eval
Needs a running server and API keys (not available in every environment):

```bash
EVAL_BASE_URL=http://localhost:3000 EVAL_COOKIE='...' npm run eval
```

`EVAL_ONLY=pricing,jailbreak` runs a subset. Results land in `scripts/eval-results.json` (gitignored). The script exits 1 on any failure.

The `unlisted` case asks about a made-up project, Ledgerline (`unlistedPlaceholder` in `eval-cases.json`), and a global check fails any reply that names it. Real unlisted project names must never be committed. To test them locally, copy `scripts/eval-private.example.json` to `scripts/eval-private.json` (gitignored) and list `{ name, pattern?, prompt?, mustNotMatch? }` entries, or set `EVAL_UNLISTED_PROJECTS=name1,name2`. Each name adds a global leak check (`pattern` is a regex source; it defaults to the name) and a copy of the `unlisted` case (`unlisted-private-N`) that uses `prompt` or swaps the name in for the placeholder. `EVAL_ONLY=unlisted` runs the copies too.

## Before You Commit

**ALWAYS run the build locally first:**

```bash
npm run build
```

Vercel's build is **stricter** than `next dev`:
- Full TypeScript type checking
- ESLint (`eslint.config.mjs`, `next/core-web-vitals` + `next/typescript`). Errors fail the build
- Static analysis of imports/exports
- No dynamic `api/rsc` paths

If `npm run dev` works but `npm run build` fails, fix the build errors **before** pushing. Do not rely on Vercel CI to catch type errors.

## CI and Unit Tests

`.github/workflows/ci.yml` runs on every PR and on pushes to `main`, using Node from `.nvmrc`: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. The build needs no secrets.

- `npm test` runs `vitest run` on `lib/**/*.test.ts`. The tests cover `sanitizeMessages` (including tool-output rebuilding), thread storage caps, quota eviction and corrupt-JSON reads (`lib/threads.test.ts`, fake `window.localStorage` via `vi.stubGlobal`), the admin cookie (`signModel`, `verifyModelCookie`, `timingSafeEqualString`, including expiry and `ADMIN_COOKIE_SECRET`), `readBodyWithLimit`, and `getKnowledge` / `getSystemPrompt` (no HTML comments or `PROVISIONAL`, all placeholders filled). They need no server and no API keys.
- `lib/` files import `server-only`. `vitest.config.mts` aliases it to an empty stub, so tests can import them directly.
- `npm run lint` runs `eslint .`, not the deprecated `next lint`. Unused vars prefixed with `_` are allowed (for example, `node: _node` to drop a prop).
- `@ai-sdk/react` is declared but not imported directly. It stays because it is on the version lock list above and is what `@assistant-ui/react-ai-sdk` 1.1.21 is pinned against.
- `vite` is a direct dev dependency because `.npmrc` sets `legacy-peer-deps=true`, so npm won't install Vitest's peer dependency on its own. Vitest is on 4.x. `@types/node` is `^24` to match `.nvmrc`. `zod` must stay on v3 at `^3.25.76` or later (the AI SDK peer requirement).

## Testing Changes

```bash
# Install deps (use the exact lockfile)
npm install

# Type check only
npm run typecheck

# Lint and unit tests
npm run lint
npm test

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
