# CLAUDE.md — Context for AI Coding Agents

This file gives you (Claude, Codex, or any other coding agent) the critical context needed to work on this repo without breaking things.

## What This Is

**jamesalmeida.me** — James Almeida's site for his AI consulting, all in on clients: individuals and small teams who want to find their place in a world with AI, at their own pace. The home page `/` is a full-screen chat with a simple landing (a question, one line of story, a big composer). The chat is run by **Skaffen, James' AI assistant**, which asks a few discovery questions, writes the visitor a brief, and funnels them to a discovery call or an email. Visitors can also read `/consulting` ("How I can help") and `/about` ("Why I do this") without chatting.

- **Production**: https://www.jamesalmeida.me (apex redirects to www)
- **Repo**: https://github.com/jamesalmeida/jamesalmeida-me
- **Deploy**: Vercel project `jamesalmeida-portfolio` on team GSV (slug `gsv-2`). Branch previews are created automatically and protected by Vercel Authentication.
- **Node**: 24 on Vercel (see `.nvmrc`)
- **PRD**: See [`PRD.md`](./PRD.md) for the original product spec. This file and `data/` are the current source of truth.

## Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind v4, `@assistant-ui/react` for chat primitives
- **AI**: Vercel AI SDK v5 (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`, `@ai-sdk/openai`)
- **Default Model**: `gpt-5.4` unless `DEFAULT_MODEL` is a known id (production sets `claude-sonnet-5-5`). A signed admin cookie overrides that.
- **Persistence**: chats live in the visitor's localStorage. The server stores transcripts, funnel events, feedback and leads in **Convex** (90-day retention except leads), plus site settings. Vercel Web Analytics counts page views.
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

Routes: `/`, `/consulting`, `/about`, `/privacy`, `/admin`, `/api/chat`, `/api/generate-title`, `/api/events`, `/api/feedback`, `/api/leads`, `/api/admin/verify`, `/api/admin/model`, `/api/admin/avatar`, `/api/admin/motion`, `/api/admin/landing`, `/api/admin/dashboard`, `/api/admin/conversation`, `/api/admin/leads`. `/work` redirects to `/about` (`next.config.ts`).

```
app/
  api/chat/route.ts            # POST, sanitized messages, streamText + tools
  api/generate-title/route.ts  # short title for a forked history thread
  api/admin/model/route.ts     # GET current model; POST password + signed cookie
  api/events/route.ts          # POST funnel events from the browser (landing_view, booking/email clicks, example_sent)
  api/feedback/route.ts        # POST thumbs up/down + feedback form
  api/leads/route.ts           # POST the brief card's email field (+ optional Resend notification)
  api/admin/verify/route.ts    # GET signed in?; POST password → session cookie; DELETE = Lock
  api/admin/avatar/route.ts    # GET site avatar + canSave; POST avatar (session) → Convex settings
  api/admin/motion/route.ts    # GET motion setting + canSave; POST motion (session) → Convex settings
  api/admin/landing/route.ts   # GET landing setting + canSave; POST headlines/examples/timing (session) → Convex settings
  api/admin/dashboard/route.ts # GET funnel, drop-off, feedback, recent chats, leads (session)
  api/admin/conversation/route.ts # GET one transcript (session)
  api/admin/leads/route.ts     # DELETE a lead (session)
  admin/page.tsx               # Insights / Leads / Settings tabs, blurred behind a password dialog (noindex)
  page.tsx                     # Full-screen chat: <ChatApp fallback={<StaticIntro />} />
  consulting/page.tsx          # "How I can help", rendered from OFFER
  about/page.tsx               # "Why I do this": the story, past work from PROJECTS, Skaffen
  privacy/page.tsx             # Plain-language privacy page (keep claims true to the code)
  opengraph-image.tsx          # Link preview (next/og, built at deploy): Skaffen, name, HEADLINES[0], composer with PROMPT_EXAMPLES[0]
  twitter-image.tsx            # Same card for X
  icon.png / icon.svg / favicon.ico / apple-icon.png
  sitemap.ts / robots.ts
  layout.tsx                   # metadata, JSON-LD; viewport maximumScale: 1
  globals.css

components/
  landing-headline.tsx         # Landing h1: "What can I do" → an "A" drops in → "What can AI do"
  static-intro.tsx             # Pre-hydration fallback for `/`: same header + landing, real h1, links
  site-header.tsx              # Top bar: avatar (landing only), name, "Book a discovery call" (from `sm`), menu icon button
  playful-avatar.tsx           # PlayfulAvatar (tap easter egg: new eyes + mood, sometimes a spin) + SkaffenAvatar (56/52 px)
  bouncing-dots.tsx            # The hopping "…" after Thinking / Writing (chat status and admin preview)
  motion-settings.tsx          # MotionSettingsProvider + useMotion(): scaled durations/springs, minimum thinking time
  admin-motion-settings.tsx    # /admin Motion sliders + Preview
  landing-settings.tsx         # LandingSettingsProvider + useLanding(): headlines, examples, this visit's headline
  admin-landing-settings.tsx   # /admin Landing: headlines in the A/B test, example prompts, time per example
  site-menu.tsx                # Menu sheet: theme, sound, links, booking, recent chats, clear all
  site-page-shell.tsx          # /consulting, /about, /privacy: a "Back to chat" button, then the page
  chat-app.tsx                 # Full-screen chat shell (app-shell), header, menu, threads
  thread.tsx                   # Landing (headline + composer) until the first message, then the conversation
  admin-avatar-settings.tsx    # /admin avatar: the package's AvatarEditor (themed) + save
  admin-dashboard.tsx          # /admin Insights (funnel, bars, feedback, recent chats), Leads, transcript dialog
  click-tracker.tsx            # Root-layout listener: clicks on [data-track] links → funnel events
  tool-cards.tsx               # showBookingCta / showBrief cards
  message-actions.tsx          # Thumbs up/down, feedback popover + form, copy (under each reply)
  booking-button.tsx           # BookingButton, EmailButton, EmailLink, BookingCard
  theme-provider.tsx           # theme preference (system/light/dark) + sound; MotionConfig reducedMotion="user"
  modal.tsx                    # Native <dialog> (showModal) wrapper; `layout="sheet"` for the menu

lib/
  system-prompt.ts             # Skaffen persona, discovery flow + guardrails
  context.ts                   # knowledge.md + generated offer and past work
  chat-tools.ts                # showBookingCta, showBrief
  tool-results.ts              # Tool input schemas + pure output builders (shared)
  brief.ts                     # Brief fields, text, mailto and Cal links (client-safe)
  feedback.ts                  # Feedback payload + submitFeedback() stub (sends nothing yet, issue #47)
  sanitize-messages.ts         # Untrusted chat body → last 20 UIMessages
  request-body.ts              # Body size cap (Content-Length, then UTF-8 bytes)
  rate-limit.ts                # In-memory per-IP / global fixed-window limiter
  bot-protection.ts            # Vercel BotID checkBotId() wrapper (403 on bots)
  admin-cookie.ts              # HMAC-signed model cookie
  admin-auth.ts                # startAdminSession (limiter → JSON → password → cookie), requireAdminSession
  analytics.ts                 # Client-safe validators for visit context, events, feedback, leads
  visit.ts                     # Browser: visit id (sessionStorage), visit context, trackEvent, postQuietly
  store.server.ts              # ConvexHttpClient wrapper (CONVEX_URL + CONVEX_SERVER_SECRET); no-op when unset
  public-request.ts            # readPublicJson: rate limit → BotID → body cap → JSON for public POSTs
  lead-notify.server.ts        # Optional Resend email to James for a new lead
  avatar-settings.ts           # Avatar setting validation + AVATAR_OPTIONS (client-safe)
  avatar-settings.server.ts    # getSiteAvatar (cached Convex read), saveSiteAvatar
  motion-settings.ts           # Motion setting: limits, defaults, strict parse (client-safe)
  motion-settings.server.ts    # getSiteMotion (cached Convex read), saveSiteMotion
  landing-settings.ts          # Landing setting: headlines (A/B), examples, timing; strict parse, pickHeadline (client-safe)
  landing-settings.server.ts   # getSiteLanding (cached Convex read), saveSiteLanding
  message-convert.ts           # assistant-ui messages → UIMessage (keeps tools)
  threads.ts                   # New chat + history threads; storage, caps, getFirstUserText
  theme.ts                     # Theme keys + inline pre-paint script (client-safe)

data/
  knowledge.md                 # Bot knowledge, about James in the third person. Placeholders {{email}} etc.
  site.ts                      # SITE, HEADLINES and PROMPT_EXAMPLES (defaults for Settings → Landing) + OFFER. Client-safe. No secrets.
  portfolio.ts                 # PROJECTS: past company work only (client-safe). `confirmed` is never rendered.

assets/og/                     # Static Latin cuts of Source Serif 4 + Inter (SIL OFL) for the link preview
public/
  resume.pdf                   # Not linked anywhere since the site went client-first
convex/                        # Convex backend: schema, chats, events, feedback, leads, settings, admin queries,
                               #   retention + crons (90 days). No _generated: lib.ts types the builders.
instrumentation-client.ts      # initBotId() for the public POST routes
next.config.ts                 # wrapped with withBotId
scripts/
  eval-chat.mjs                # npm run eval
  eval-cases.json
  eval-private.example.json    # shape for gitignored eval-private.json

lib/*.test.ts                  # Vitest unit tests (npm test)
test/convex.test.ts            # convex-test: the Convex functions against an in-memory backend
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
CONVEX_URL=https://<name>.convex.cloud  # deployment origin, no trailing slash. Production only.
                                   # Previews leave this unset; the build inlines NEXT_PUBLIC_CONVEX_URL.
CONVEX_SERVER_SECRET=...           # must match the same variable on that Convex deployment; every Convex function checks it
CONVEX_DEPLOY_KEY=...              # production deploy key on Vercel Production; preview deploy key on Vercel Preview.
                                   # `npm run build` runs `convex deploy` when it is set. Never put the production key on Preview.
RESEND_API_KEY=... / LEAD_NOTIFY_FROM=... / LEAD_NOTIFY_TO=...  # optional lead email to James
```

Model ids live in `lib/models.ts` and `lib/models.server.ts`. Remove a model there before its provider retirement date. A cookie or `DEFAULT_MODEL` that names a removed id falls back to the default, unless the id is listed in `LEGACY_MODEL_IDS` (`lib/models.ts`), which maps it to its replacement. `claude-sonnet-4-5` (deprecated by Anthropic, retires 2026-11-30) maps to `claude-sonnet-5-5`.

## Key Rules

### Persona
- The site is **all in on clients**: individuals and small teams. No hiring CTAs, no "remote role" framing, no resume links.
- The **pages** speak as James in first person ("I", "my"). The **chat** is Skaffen, James' AI assistant (`SITE.assistant`), and talks about James in the third person ("James", "he"). Skaffen is open about being AI, never claims to be James, and never promises James' time, a price, a start date or a result.
- There is one Skaffen on screen: on the landing its animated avatar sits in the header, left of "James Almeida"; in a conversation it leaves the header (the name stays "James Almeida" and slides left) and sits above the latest reply as its status, with a line of text beside it ("Thinking…", "Writing…", then "James' AI assistant"); the name "Skaffen" is not shown. Skaffen still introduces itself by name when asked. Write "James'" (no extra s).
- The name: Skaffen-Amtiskaw, the drone in Iain M. Banks' *Use of Weapons* (James is a Culture fan). GSV echoes the Culture's General Systems Vehicles; Skaffen may say so only when asked about its name or the company.
- Discovery flow: one useful thought per reply, at most one question per reply, stop after about 3 or 4 questions, then `showBrief`. Tone is calm and kind; never alarmist about AI and jobs.
- General Systems Ventures / GSV is otherwise only for contracts and billing. Never "we" as the company.
- Public contact is `james@gsv.to`, X `@james_almeida`, GitHub, LinkedIn, and the Cal booking link. No phone number. Never state how long the discovery call is. The CTA is "Book a discovery call" (`SITE.bookingLabel`, `SITE.bookingUrl`; keep the URL unchanged).
- James' personal apps and side projects (Konteks and the rest) have **not shipped**. The site and Skaffen never mention, list or describe them; if asked, Skaffen says it's not something James shares publicly here, without echoing the name. Only company work at Society6, iROKOtv and Datadog (`PROJECTS`) is described as shipped, and only when asked. Never say "one-person AI lab".

### Content
- `data/site.ts` exports `SITE`, `HEADLINES` (the landing question) and `PROMPT_EXAMPLES` (rotating composer placeholders), which are only the defaults for the Landing site setting (see below), and `OFFER`. Pages and the bot both use `OFFER`. Do not copy prices into page copy. There is no price for individuals: James scopes it on the call.
- `data/portfolio.ts` exports `PROJECTS` (past company work only). Never render `confirmed`.
- `data/knowledge.md` is the swappable bio, written about James in the third person. `lib/context.ts` strips HTML comments, fills `{{email}}`, `{{bookingUrl}}`, `{{linkedin}}`, `{{github}}`, `{{x}}`, `{{xHandle}}` from `SITE`, then appends the offer and past-work markdown.
- Provisional business decisions are one value plus a `// PROVISIONAL:` comment in `.ts`, or `<!-- // PROVISIONAL: ... -->` in `.md`. Find them with `rg "PROVISIONAL"`. Comments are stripped before the model sees the knowledge, so that word must not reach the prompt.

### Home page: full-screen chat

`/` must stay a full-screen chat. It must never become a scrolling page with sections.

- `ChatApp` fills the viewport (`.app-shell`, height `var(--app-height, 100dvh)`; `body` is fixed with `overflow: hidden`). The document never scrolls. Only the message viewport and the menu scroll. `ChatApp` sets `--app-height` from `visualViewport.height` and `--app-offset` from `visualViewport.offsetTop` (the shell is `translateY(var(--app-offset))`): when the iOS keyboard opens it both shrinks and pans the visual viewport, and without the offset the whole site slides up out of view.
- Layout: `SiteHeader` (Skaffen's avatar on the landing and the name, then "Book a discovery call" from `sm` up, then an icon-only menu button with a two-line icon, `aria-label="Menu"`), then the thread. There is no sidebar. Clicking the name starts a new chat (the current one stays in Recent chats); `SiteHeader` is a client component for that. When a conversation starts (`ChatApp.isConversation`, reported by `Thread`'s `onConversationChange`), the header avatar shrinks to nothing and its wrapper's width and margin collapse, so the name slides left into its place; New chat brings it back. The name is "James Almeida" in every state: stacked on phones ("James" / "Almeida", 18 px) and one line from `sm` (26 px). Skaffen is drawn at 56 px and scaled to 52 px on phones with CSS (`SkaffenAvatar`), in the header and in the thread, so the server render (`StaticIntro`) and the first client render agree.
- Landing (a thread with no messages): the h1 is this visit's headline (see Landing below); by default "What can AI do for you?" (`REVEAL_HEADLINE`, `HEADLINES[0]`). For that headline only, `LandingHeadline` (`components/landing-headline.tsx`) first shows it as "What can I do for you?" and, about a second later, an "A" opens a gap and drops in next to the "I" (shown at once with reduced motion). The "A" is always in the DOM, collapsed, so crawlers and screen readers read the full headline; `StaticIntro` renders it with `still` (the first frame). The reveal is driven by state, because the landing's `AnimatePresence initial={false}` skips child entrance animations. It replays after New chat. Then `SITE.subhead`, then a large composer that shows "Try “…”" with one of the landing examples, starting at a random one per visit. The example slides out and the next slides in every `exampleIntervalMs` (default 4.5 s) until the visitor focuses the composer or types (an `aria-hidden` overlay, since a native placeholder can't animate). Sending an empty landing composer (button or Enter) sends the example shown and records an `example_sent` event with its text. No suggestion chips, no project cards. The privacy notice sits at the bottom.
- First send: the landing fades up and away (`AnimatePresence`), the composer glides to the dock (shared `layoutId="composer"`, `layout="position"`), the first message slides up into place and the reply fades in. Only messages that weren't there when the thread mounted animate (`InitialMessageIdsContext`), so restored chats don't replay.
- Conversation: a centered column (`max-w-[760px]`), user messages in `--user-bubble` bubbles, assistant messages as plain text (a visually hidden "James' AI assistant said:" heading for screen readers). The composer floats at the bottom inside the viewport (a sticky `ThreadPrimitive.ViewportFooter` with a fade to the background), so messages slide behind it, and a matching fade at the top of the message area lets messages fade out under the header. The scroll-to-latest button sits just above the composer, centred. Focusing the docked composer scrolls to the latest message, and sending a message blurs the composer (closing the phone keyboard); both re-scroll after each visual-viewport resize for a second (`followKeyboard`), so the scroll button doesn't show while typing and a sent message stays anchored at the top once the keyboard has closed. The footer's bottom padding is small on phones (`pb-2`) to sit close to Safari's toolbar. In a conversation the privacy notice sits under the composer on desktop and is hidden on phones (the landing shows it on both). The message column grows to push the footers down: never put `mt-auto` on a `ViewportFooter`, because assistant-ui counts a footer's top margin in its height and the turn anchoring breaks.
- Scrolling: the viewport uses `turnAnchor="top"`. When the visitor sends a message, it scrolls to the top of the viewport and the reply streams in below it; earlier messages sit above the fold and stay reachable by scrolling up. `MessagePrimitive.Root` gives the last reply the room for this, so spacing between messages is top padding on each message (`pt-7`), not a flex gap: the anchored message's measured height must include it. When a reply finishes, assistant-ui swaps the streamed message for the final one and that room briefly disappears, which clamps the scroll position and makes the chat jump up; `KeepAnchorOnRunEnd` scrolls back to the bottom two frames later if the visitor was anchored at the bottom when the run ended (not if they had scrolled up).
- Tapping Skaffen (`PlayfulAvatar`, `components/playful-avatar.tsx`, in the header and above the latest reply) is an easter egg: for 2.6 s it swaps to a random other eye shape and a random mood; a quarter of taps also do a flat 360° spin with a hop, and another quarter a turn: the eyes wind up, slide off one side of the body and come back in from the other, like a 3D shape spinning (agent-avatars' `spin` prop, 0.3+). The flat spin is framer-motion (`MotionConfig reducedMotion="user"` drops it); the package's turn respects reduced motion itself. It is a button labelled "Say hi to Skaffen"; the name, not the avatar, starts a new chat. While idle, Skaffen's eyes follow the mouse when it comes close (`followPointer`) and look at whatever has focus, such as the composer (`followFocus`): whichever moved last wins. Both are off with reduced motion. In dark mode it has a subtle edge (`outline`, coloured by `--aa-outline-color` in `globals.css`: transparent in light mode, soft white in dark), so a dark avatar doesn't disappear on the dark background.
- In a conversation, `ReplyAvatar` (`components/thread.tsx`) shows Skaffen (`SkaffenAvatar`, the header's size) and a status line (the reply's text size, `--muted` so it is a little dimmer than the reply, `aria-hidden`): "Thinking…" while its mood is `thinking`, "Writing…" while `writing` (the three dots hop one after another: `BouncingDots` in `components/bouncing-dots.tsx`, `.status-dot` in `globals.css`, paced by the motion setting, still with reduced motion), otherwise `SITE.assistant.role` ("James' AI assistant"), crossfading as it changes. They sit above the latest assistant message only (`isLast`): it pops in under each new message and shrinks away from the previous reply (`AnimatePresence`, height collapses). A new reply is held back for the minimum thinking time (`useThinkingHold`), so Skaffen visibly thinks even when the reply is ready at once; the hold is kept in a module-level map keyed by the reply's `parentId`, because a quick first reply forks the chat into history and remounts the thread. Its mood is `thinking` during the hold and until the first content arrives, `writing` while the reply streams, `happy` for 2.8 s when a new reply brings `showBrief` (`useHappyMoment`), `listening` while the visitor types, otherwise `idle`. Restored chats show it without the pop. The empty running reply keeps a visually hidden "Writing a reply" for screen readers.
- Landing is a site setting (`lib/landing-settings.ts`, Convex `settings` key `landing`, tag `site-landing`, read in `app/page.tsx` like the avatar; defaults from `HEADLINES` and `PROMPT_EXAMPLES`, with only the first headline in the test): 1–8 headlines, each with an `active` flag (in the A/B test), 1–20 example prompts (80 characters each, no blanks or duplicates) and `exampleIntervalMs` (2–10 s). `ChatApp` picks the visit's headline in its first client render (`chooseHeadline` in `components/landing-settings.tsx`: kept in sessionStorage `jamesalmeida-headline` while it stays active, else a random active one) and sets it on the visit context (`setVisitHeadline`), so `landing_view` and every later event carry it. While more than one headline is active, `StaticIntro` keeps its h1 (the first active one) at `opacity-0` and shows no example, so the visit's own headline fades in (`.landing-fade-in`) instead of swapping. Edit it in `/admin` → Settings → Landing.
- Motion is a site setting (`lib/motion-settings.ts`, Convex `settings` key `motion`, tag `site-motion`, read in `app/page.tsx` like the avatar): `durationScale` (0.5–3, default 1) multiplies every chat transition (header avatar, reply avatar, message entrances, landing exit, composer glide, tap tricks) through `useMotion()` (`components/motion-settings.tsx`; `spring(base, bounce)` and `seconds(base)`), and `minThinkingMs` (0–4000, default 1200). The base durations are deliberately unhurried so visitors can follow where things move. Tune both in `/admin` → Settings → Motion (sliders with a Preview).
- Skaffen's avatar is `<AgentAvatar>` from James' own package [`@jamesalmeida/agent-avatars`](https://github.com/jamesalmeida/agent-avatars) (playground: https://jamesalmeida.github.io/agent-avatars/), configured by a site setting: shape, colour, fill, eyes, eye colour. `SITE.assistant.avatar` is the default; a look saved in `/admin` lives in Convex (`settings`, key `avatar`) and wins. `app/page.tsx` reads it with `getSiteAvatar()` (`unstable_cache`, tag `site-avatar`, revalidated on save and hourly, so `/` stays static; a failed read throws inside the cache so the fallback isn't cached) and passes it to `ChatApp` and `StaticIntro`, then `SiteHeader`. Without Convex configured, or if the read fails, the default is used. The package is one `"use client"` bundle, so the server can't call its `resolveConfig`: `lib/avatar-settings.ts` keeps its own copy of the option names (`AVATAR_OPTIONS`), and `lib/site-avatar.test.ts` fails if they drift. It is rendered in `SiteHeader` on the landing and by `ReplyAvatar` in a conversation (never both), each through `PlayfulAvatar`. The site uses agent-avatars 0.4+ (the `thinking` mood, `spin`, `followFocus`, `outline` and `AvatarEditor`). The package injects its own stylesheet and respects reduced motion. To change the avatar's behaviour, change and release the package, then bump it here.
- Under every finished reply with text: thumbs up/down (`aria-pressed`, one at a time, click again to clear) and a copy button whose icon turns into an animated check for 1.8 s. Rating shows a "Thank you" popover with "Share more feedback", which opens a form ("What was helpful?" with details, or "What could be better?" with `DOWN_REASONS` plus optional details). `submitFeedback()` (`lib/feedback.ts`) posts to `POST /api/feedback` with the reply, the visitor's message before it and the conversation id; clicking a rating again sends `rating: null`, which deletes it. One row per reply (`messageId`); rating again or adding details updates it.
- On phones the booking button lives only in the menu and in the booking/brief cards.
- Menu (`SiteMenu`, a `Modal` with `layout="sheet"`: full screen on phones, a right-hand panel from `sm`) grows out of the Menu button (transform origin at its centre) and shrinks back into it on close; it draws its own fading backdrop. Closing (button, Escape, backdrop, or after New chat / a recent chat / Clear all) animates first and then calls `onClose`. theme chooser (System / Light / Dark, icon buttons with `aria-pressed`), an icon-only sound button, close; then New chat, How I can help, Why I do this, Email me, Privacy (large, slightly tight tracking, underlined on hover and focus); the booking button; and a Recent chats card with per-chat delete and "Clear all chats" (with a confirm step).
- Before hydration, `StaticIntro` renders the same header and landing in the same frame (no layout shift) with the real h1 and crawlable links. No prices.
- `/consulting`, `/about` and `/privacy` are normal scrolling pages (`.site-page`, `SitePageShell`) with a single "Back to chat" button at the top, no nav bar.

### Persistence
- There is one built-in thread, `new-chat` (the landing). User messages live in `localStorage` per thread. A stored active id that is no longer valid (e.g. the old pinned threads `projects`, `work-with-me`) falls back to `new-chat` (`resolveActiveThreadId`), and their stored messages are pruned.
- Tool cards are kept: `lib/message-convert.ts` turns completed assistant-ui tool calls into `tool-*` parts with `state: "output-available"`. `@assistant-ui/react-ai-sdk` 1.1.21 converts those back into tool-call parts on reload.
- `ThreadPersistence` (`components/thread.tsx`) saves only when no run is streaming, and flushes unsaved messages on `pagehide`, `visibilitychange` (hidden) and unmount. `ChatApp.updateStoredThreads` writes localStorage synchronously.
- Caps: 50 history threads (newest kept) and the last 100 messages per thread. Stored messages for history threads not in the list are pruned.
- "New chat" in the menu opens a fresh landing. If the new chat has messages that never got a reply, they move into history first.
- All localStorage access in `lib/threads.ts` is wrapped in try/catch and never throws. On `QuotaExceededError`, `writeStoredThreads` evicts the oldest half of history threads and retries once; evicted threads are also removed from Recent chats.
- "Clear all chats" in the menu (with a confirm step) calls `clearStoredChats()` in `lib/threads.ts`, which removes the three chat keys and keeps theme/sound prefs. `ChatApp` bumps a generation counter (also used by New chat) so the old thread remounts and its unmount flush is ignored.
- The landing composer (and `StaticIntro`), and the docked composer from `sm` up, show a one-line notice (`components/privacy-notice.tsx`): a lock icon, a dotted-underlined "Your privacy" link to `/privacy`, and "Please don't share sensitive information." The providers and storage details live on `/privacy`. If you change providers, storage, logging, cookies or abuse protection, update `app/privacy/page.tsx` and that notice to match.
- The new chat forks into a history thread (and requests a title, shown in Recent chats) only after its first run ends with a completed assistant message that has content. Errored runs and runs stopped with the Stop button don't fork. The Stop button sets a flag, because a stopped AI SDK run still reports a `complete` status.
- Deleting a chat from Recent chats opens a confirm dialog in `ChatApp`.
- Server-side storage (Convex, `convex/`): `/api/chat` records each visitor message and, after the stream, Skaffen's reply (text and tool names) with `after()`, keyed by `conversationId` = the chat's first message id (sent by the transport's `prepareSendMessagesRequest`, so it survives the fork into history). Transcripts, events and feedback get `expiresAt` = 90 days and a daily cron (`convex/crons.ts`, `retention.purgeExpired`) deletes them. Leads and settings are kept. **Clear all chats only clears the browser; the server copy expires on its own. Don't add copy about this in the app.** Never store IP addresses or user agents.
- Funnel events: `landing_view` (once per page load, `ChatApp`), `chat_started` (first message, server), `brief_shown` (server, from the reply's tools), `booking_clicked` / `email_clicked` (`ClickTracker`, any link with `data-track`; `data-conversation-id` on the brief/booking cards ties the click to a chat), `example_sent` (the landing example sent with an empty composer, with its text in `example`). Each carries the visit id (random, sessionStorage, ends with the tab) and the visit context (headline, referrer host, UTM tags, phone/tablet/desktop). The headline is any text up to 120 characters, since headlines are edited in `/admin`.
- Analytics never block or break the page: client posts are fire-and-forget (`keepalive`), server writes run in `after()` and only log on failure. Without a deployment URL and `CONVEX_SERVER_SECRET` (local dev, CI, a preview that has no Convex key) nothing is stored and `/api/leads` returns 503. A Vercel preview that has a preview deploy key gets its own Convex deployment; it does not write to production.

### Theme, motion and accessibility
- `app/layout.tsx` runs `themeInitScript` (`lib/theme.ts`) in `<head>`. It sets the `dark` class and the theme-color meta before first paint. A stored `light` or `dark` wins; `system` (or nothing stored) follows `prefers-color-scheme`, and `ThemeProvider` keeps following it live. Keep the two in line.
- The accent is fixed (slate `#2f4858`, `#8ba4b5` in dark). There is no accent picker.
- `prefers-reduced-motion` is respected: `MotionConfig reducedMotion="user"` in `ThemeProvider`, and a media query in `globals.css` that turns off CSS transitions and animations. Sounds default to on unless the visitor turns them off (stored as `jamesalmeida-sounds: "off"`). Dismissing the menu (close button, Escape, backdrop) plays the soft `whisper`; closing after a menu action stays quiet because the action already ticked.
- Theme changes fade: `ThemeProvider.setPreference` puts `.theme-transition` on `<html>` for 500 ms, and `globals.css` transitions colours under it (only without reduced motion). The selected theme pill slides (`layoutId="theme-pill"`).
- `ChatApp` has a visually hidden `aria-live="polite"` region. It announces the text of the latest completed reply once the run ends, not every token. It lives in `ChatApp` because the first reply remounts `Thread`.
- The composer has `maxLength={2000}`, the same as the server's per-part cap, and shows a character counter from 1,800 characters.

### Dialogs and menus
- Modals use `components/modal.tsx`: a native `<dialog>` opened with `showModal()` (focus trap, Escape, top layer), labelled via `aria-labelledby`, closed on backdrop click, and returning focus to the trigger (or `returnFocusRef`). Mount it only while open. Don't build new modals from `div`s. Its `close` handler ignores a close event that arrives while the dialog is open again (StrictMode in dev). Escape (`cancel`) is turned into `onClose` instead of closing natively, so an owner can animate out first. The sheet layout has a transparent `::backdrop`.
- The site menu is that dialog with `layout="sheet"`. It opens with focus on its close button and returns focus to the Menu button.

### Chat tools and abuse caps
- `showBookingCta` renders a booking card from `SITE` (how to book or contact, price, timing). It takes no input. Old stored parts with a `reason` field still validate, because the key is stripped.
- `showBrief` renders "Your brief": optional `who`, `challenge`, `tried`, `hopingFor`, `timing` strings (trimmed, at most 200 characters each; `who` or `challenge` required). The card waits for the tool result, can be edited in place, and its buttons carry the brief: "Book a discovery call" adds it as Cal's `notes` query parameter, "Email James" puts it in a `mailto:` body (`lib/brief.ts`). Nothing is sent unless the visitor clicks. Under the buttons, an optional "Not ready to book? Leave your email" form (name optional) posts the email, name, current brief and conversation id to `/api/leads`; it shows "Thanks. James has your email and this brief." Skaffen points to it but never asks for an email or name in the chat.
- `showPortfolio` was removed. Stored `tool-showPortfolio` parts are dropped by `sanitizeMessages` and render nothing.
- `POST /api/chat` rejects bodies over 200 KB (413) and bad JSON (400). `sanitizeMessages` drops system roles and unknown parts, keeps the last 20 user/assistant messages, truncates each text part to 2,000 characters, and requires the last message to be from the user.
- Client-sent tool parts are never trusted. `sanitizeMessages` discards their `output`, validates `input` with the schemas in `lib/tool-results.ts` (also used by `lib/chat-tools.ts`), and rebuilds the output with the same pure functions the tools' `execute` uses. Parts are dropped if input is invalid, over 1.5 KB serialized, or has a malformed `toolCallId`. Max 4 tool parts per message and 8 KB of tool input per request. Assistant text parts are still accepted as sent (2,000-char cap); signing them is not done.
- `streamText` uses `stopWhen: stepCountIs(3)` and `maxOutputTokens: 800`. The system prompt is sent as a system message with `providerOptions.anthropic.cacheControl` (ephemeral) when an Anthropic model is selected. The stream sends no message metadata, so the active model is never exposed to visitors.
- Body limits are in bytes (`lib/request-body.ts`): a `Content-Length` over the limit is rejected before reading, then the UTF-8 length is checked.
- `POST /api/generate-title` rejects bodies over 10 KB and truncates the message to 500 characters. A provider error returns `{ title: null }` (200).

### Abuse protection
- Both model routes run, in order: rate limit → BotID → body parsing. So do `/api/events` (2 KB), `/api/feedback` (12 KB) and `/api/leads` (4 KB), through `readPublicJson` (`lib/public-request.ts`).
- `lib/rate-limit.ts` keys on the first `x-forwarded-for` IP, then `x-real-ip`, then `"unknown"`. Limits: `/api/chat` 30 per 10 min per IP plus 600 per hour across all visitors; `/api/generate-title` 20 per 10 min per IP; `/api/events` + `/api/feedback` 60 per 10 min per IP (shared); `/api/leads` 5 per 10 min per IP. Over the limit returns 429 JSON with `Retry-After` (seconds). The map is capped (expired entries swept, then oldest evicted). State is **per serverless instance** (cold starts reset it, instances don't share it), which is accepted: no external storage.
- BotID (`botid` package, `basic` check level) is set up in `instrumentation-client.ts` and checked in `lib/bot-protection.ts`. Keep paths and check level in sync. Bots get 403. It returns `isBot: false` in dev. If `checkBotId()` throws (for example, no Vercel OIDC token under a local `next start`), the request is allowed and the error is logged.
- `components/thread.tsx` turns a 429/403 from `/api/chat` into a short friendly error (`BLOCKED_MESSAGE`); any other chat error shows a generic "Something went wrong" message. A run that fails before any assistant content (429, 403, or a stream that errors right after `start`) creates no assistant message, so `Thread` catches the error with `useChatRuntime`'s `onError` and `RunErrorNotice` shows it under the last user message until the next run starts. Errors after some content still show inside the assistant message (`MessagePrimitive.Error`). Title generation failures stay silent.
- Spend caps in the OpenAI and Anthropic dashboards are the backstop.
- Running `npm run eval` against a deployed URL: BotID may 403 requests that come from Node, because they lack the browser's BotID headers. Run it against `npm run dev`.

### Admin panel
- Route: `/admin` (noindex): tabs Insights, Leads, Settings, plus "Back to site" and Lock buttons. "Back to site" is a plain `<a>` (a full page load, lint rule disabled on purpose): a client-side `Link` reuses the router's cached `/` and hides a just-saved avatar. It loads blurred and `inert` behind a password dialog (`Modal`; Escape and the backdrop don't close it, "Back to the site" leaves) until `GET /api/admin/verify` says the browser is signed in.
- `POST /api/admin/verify` (`startAdminSession`, `lib/admin-auth.ts`): `adminIpLimiter` (10 per 15 min per IP, every attempt counts, 429 with `Retry-After`), JSON (400), timing-safe compare against `ADMIN_PASSWORD` (500 if unset, 401 if wrong), then sets the httpOnly, `sameSite: strict` cookie `jamesalmeida-admin` = `admin-session.${issuedAtSeconds}.${HMAC}` for 12 hours (same key as the model cookie; the two can't be swapped). `DELETE` clears it. Every other admin route calls `requireAdminSession()` (401 without it), and a 401 locks the page again.
- Insights (`components/admin-dashboard.tsx`, `convex/admin.ts`): 7/30/90-day range; funnel stats (distinct visits per step, plus leads); "How far chats went" and "Where they ended" bars; sources and headlines; "How chats started" (each landing example sent, how many of those visits got a brief, and how many typed their own first message); feedback with reasons, comments, the reply and the visitor's message; recent chats that open a transcript dialog. Leads: email (mailto), name, brief, View chat, Delete. Without Convex it shows how to set it up.
- Settings → Skaffen's avatar: the package's `<AvatarEditor>` (shape tiles, colour and eye-colour swatches plus a custom colour picker, fill, eyes, a live preview with a mood switcher), themed with the site's colours through its `--aa-editor-*` variables, then "Save for everyone" and "Reset to default". `POST /api/admin/avatar` validates strictly (`parseAvatarSetting`: every field, presets or hex colours, no extra keys), saves to Convex `settings`, then revalidates the `site-avatar` tag and `/`. `GET /api/admin/avatar` returns `{ avatar, source, canSave }`.
- Settings → Landing (`components/admin-landing-settings.tsx`): headlines with an "In test" checkbox, example prompts, add and remove rows, a "Time per example" slider, "Save for everyone" and "Reset to default" (Save stays off with an empty row, a duplicate or no headline in the test). `POST /api/admin/landing` validates strictly (`parseLandingSetting`), saves to Convex `settings`, then revalidates the `site-landing` tag and `/`.
- Settings → Motion: "Animation pace" and "Minimum thinking time" sliders, a Preview that replays Skaffen popping in, "Thinking…" for the minimum thinking time, "Writing…" while the reply fades in, then "James' AI assistant", at the slider values (the same status line and bouncing dots as the chat), "Save for everyone" and "Reset to default". `POST /api/admin/motion` validates strictly (`parseMotionSetting`), saves to Convex `settings`, then revalidates the `site-motion` tag and `/`.
- Settings → Model: `POST /api/admin/model` sets httpOnly cookie `jamesalmeida-model` (30 days) to `${model}.${issuedAtSeconds}.${base64url HMAC-SHA256}`. The key is `ADMIN_COOKIE_SECRET` if set, else `ADMIN_PASSWORD`. No cookie is signed or honoured without `ADMIN_PASSWORD`. Unsigned, unknown-model, old-format and expired (older than 30 days) cookies are ignored, and the default model is used.
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

- `npm test` runs `vitest run` on `lib/**/*.test.ts` and `test/**/*.test.ts`. The tests cover `sanitizeMessages` (including booking and brief output rebuilding), thread storage caps, quota eviction, corrupt-JSON reads and `resolveActiveThreadId` (`lib/threads.test.ts`, fake `window.localStorage` via `vi.stubGlobal`), the admin cookies (`signModel`, `verifyModelCookie`, `signAdminSession`, `verifyAdminSession`, `timingSafeEqualString`, including expiry and `ADMIN_COOKIE_SECRET`), `readBodyWithLimit`, the brief links (`lib/brief.test.ts`), the feedback payload (`lib/feedback.test.ts`), the avatar options, `parseAvatarSetting` and `AVATAR_OPTIONS` against the package (`lib/site-avatar.test.ts`), the analytics validators (`lib/analytics.test.ts`), the motion setting (`lib/motion-settings.test.ts`), the landing setting and headline pick (`lib/landing-settings.test.ts`), the Convex functions with `convex-test` (`test/convex.test.ts`: server secret, funnel and dashboard, feedback upsert/clear, leads, 90-day purge; the test fakes a `_generated` path so convex-test can find the modules), `PROJECTS`, `getFirstUserText`, and `getKnowledge` / `getSystemPrompt` (no HTML comments or `PROVISIONAL`, all placeholders filled, Skaffen persona, no unshipped app names). They need no server and no API keys.
- `npm run build` is `scripts/build.mjs`: with `CONVEX_DEPLOY_KEY` it runs `npx convex deploy --cmd "npm run build:next"`, so `convex/` deploys with the site. A production deploy key updates production. A preview deploy key creates a Convex deployment for the git branch and sets `NEXT_PUBLIC_CONVEX_URL` for the Next build (the runtime reads that when `CONVEX_URL` is unset). Without a key (CI, local) it runs `next build` (`build:next`). It logs which at the top of the build log (`[build] ...`). Vercel's default Build Command (`npm run build`) is all it needs; `vercel-build` is an alias for anyone who set the override. The client normalizes the deployment URL to its origin: a trailing slash makes `ConvexHttpClient` call `//api/query`, which returns an empty 404.
- `convex-test` and `@edge-runtime/vm` are dev dependencies for `test/convex.test.ts` (`// @vitest-environment edge-runtime`).
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
