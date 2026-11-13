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
  api/events/route.ts          # POST funnel events from the browser (landing_view, booking/email clicks, example_sent, offer_declined)
  api/feedback/route.ts        # POST thumbs up/down + feedback form
  api/leads/route.ts           # POST "Send to James" on the brief card (+ optional Resend notification)
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
  icon.png / icon.svg / favicon.ico / apple-icon.png
  sitemap.ts / robots.ts
  layout.tsx                   # metadata, JSON-LD; viewport maximumScale: 1
  globals.css

components/
  landing-headline.tsx         # Landing h1: "What can I do" → an "A" drops in → "What can AI do"
  static-intro.tsx             # Pre-hydration fallback for `/`: same header + landing, real h1, links
  site-header.tsx              # Top bar: avatar (landing only), name, "Book a discovery call" (from `sm`), menu icon button
  playful-avatar.tsx           # PlayfulAvatar (tap easter egg: new eyes + mood, sometimes a spin or a gesture) + SkaffenAvatar (56/52 px)
  bouncing-dots.tsx            # The hopping "…" after Thinking / Writing (chat status and admin preview)
  motion-settings.tsx          # MotionSettingsProvider + useMotion(): scaled durations/springs, minimum thinking time
  paced-text.ts                # usePacedText(): a reply's text appearing at the text speed (chat and admin preview)
  admin-motion-settings.tsx    # /admin Motion sliders + Preview
  landing-settings.tsx         # LandingSettingsProvider + useLanding(): headlines, examples, this visit's headline
  admin-landing-settings.tsx   # /admin Landing: headlines in the A/B test, example prompts, time per example
  admin-share-card.tsx         # /admin Share card: edit the link-preview card, animated canvas preview, PNG + video download
  site-menu.tsx                # Menu sheet: theme, sound, links, booking, recent chats, clear all
  site-page-shell.tsx          # /consulting, /about, /privacy: a "Back to chat" button, then the page
  chat-app.tsx                 # Full-screen chat shell (app-shell), header, menu, threads
  thread.tsx                   # Landing (headline + composer) until the first message, then the conversation
  admin-avatar-settings.tsx    # /admin avatar: the package's AvatarEditor (themed) + save
  admin-dashboard.tsx          # /admin Insights (funnel, bars, feedback, recent chats), Leads, transcript dialog
  click-tracker.tsx            # Root-layout listener: clicks on [data-track] links → funnel events
  conversation-id.tsx          # The chat's stored conversation id for tool cards and feedback
  use-settings-form.ts         # Shared /admin settings form hook (load, edit, save, 401)
  tool-cards.tsx               # showBookingCta / showBrief cards
  message-actions.tsx          # Thumbs up/down, feedback popover + form, copy (under each reply)
  booking-button.tsx           # BookingButton, EmailButton, EmailLink, BookingCard
  theme-provider.tsx           # theme preference (system/light/dark) + sound; MotionConfig reducedMotion="user"
  modal.tsx                    # Native <dialog> (showModal) wrapper; `layout="sheet"` for the menu card

lib/
  system-prompt.ts             # Skaffen persona, discovery flow + guardrails
  context.ts                   # knowledge.md + generated offer and past work
  chat-tools.ts                # showBookingCta, showBrief
  tool-results.ts              # Tool input schemas + pure output builders (shared)
  brief.ts                     # Brief fields, text, mailto and Cal links (client-safe)
  feedback.ts                  # Feedback payload + submitFeedback() → POST /api/feedback
  sanitize-messages.ts         # Untrusted chat body → the newest UIMessages, up to 40,000 characters
  request-body.ts              # Body size cap (Content-Length, then UTF-8 bytes)
  rate-limit.ts                # In-memory per-IP / global fixed-window limiter
  bot-protection.ts            # Vercel BotID checkBotId() wrapper (403 on bots)
  jev-decision.ts              # Pure Jev policy: block thresholds, offer rules and cooldown, CTA nudge, fit label (client-safe)
  job-card.ts                  # The job card: normalize, merge, completeness, quote check, prompt note, /admin rows (client-safe)
  job-card.server.ts           # Updates the card after a reply with a small fixed model
  jev-quality.ts               # Pure policy: sentiment, went-badly threshold, reason (no imports; Convex uses it)
  jev.server.ts                # TypeSafe Jev client (TYPESAFE_API_KEY). Soft-skip when unset
  blocked-chat.ts              # Refusal UI stream when Jev blocks a turn (no chat LLM)
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
  share-card.ts                # drawShareCard(): the share card on a canvas at time t (browser-only), video type pick
  og.ts                        # OG_IMAGE / OG_VIDEO / OG_MEDIA: the link preview files in public/og, used by every page's metadata
  message-convert.ts           # assistant-ui messages → UIMessage (keeps tools)
  threads.ts                   # New chat + history threads; storage, caps, conversationId, getFirstUserText
  thread-session.ts            # Which chat is on screen; the session counter that decides remounts
  brief-card.ts                # The brief card's flow: edits, collapse, send; sent is terminal
  brief-store.ts               # The brief card's edits and sent state in this browser, per card
  settings-form.ts             # /admin settings form flow: loading, failed load, editing, saving
  turn-result.ts               # Server turn result: refused, completed, stopped, failed
  run-lifecycle.ts             # A client run's outcome and the chime it plays
  offer-outcome.ts             # Offer answers tied to a card; accepted is terminal
  feedback-state.ts            # One reply's rating, panel and details in this browser, with a sequence
  conversation-stage.ts        # One definition of a chat's stage for /admin and chats.ts
  reply-phase.ts               # Reply thinking/writing/settled: mood, status, Stop and actions
  composer-input.ts            # Empty, blank or typed composer; when the example is sent
  share-recorder.ts            # Share card video recorder: idle, preparing, recording, failed
  admin-session.ts             # /admin session: checking, locked, open, expired
  theme.ts                     # Theme keys + inline pre-paint script (client-safe)

data/
  knowledge.md                 # Bot knowledge, about James in the third person. Placeholders {{email}} etc.
  site.ts                      # SITE, HEADLINES and PROMPT_EXAMPLES (defaults for Settings → Landing) + OFFER. Client-safe. No secrets.
  portfolio.ts                 # PROJECTS: past company work only (client-safe). `confirmed` is never rendered.

assets/og/                     # Static Latin cuts of Source Serif 4 + Inter (SIL OFL) for the share card studio
public/
  og/og-image.png              # Link preview image (og:image, X), 1200 × 630, made in /admin → Share card
  og/og-video.mp4              # Link preview video (og:video), 1200 × 630 MP4, made in /admin → Share card
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
TYPESAFE_API_KEY=...               # optional. Server-only. Jev screens each visitor turn before the chat model.
                                   # Unset (or a failed call) skips the check. Set on Vercel Production and Preview.
```

Model ids live in `lib/models.ts` and `lib/models.server.ts`. Remove a model there before its provider retirement date. A cookie or `DEFAULT_MODEL` that names a removed id falls back to the default, unless the id is listed in `LEGACY_MODEL_IDS` (`lib/models.ts`), which maps it to its replacement. `claude-sonnet-4-5` (deprecated by Anthropic, retires 2026-11-30) maps to `claude-sonnet-5-5`.

## Key Rules

### Persona
- The site is **all in on clients**: individuals and small teams. No hiring CTAs, no "remote role" framing, no resume links.
- The **pages** speak as James in first person ("I", "my"). The **chat** is Skaffen, James' AI assistant (`SITE.assistant`), and talks about James in the third person ("James", "he"). Skaffen is open about being AI, never claims to be James, and never promises James' time, a price, a start date or a result.
- There is one Skaffen on screen: on the landing its animated avatar sits in the header, left of "James Almeida"; in a conversation it leaves the header (the name stays "James Almeida" and slides left) and sits above the latest reply as its status, with a line of text beside it ("Thinking…", "Writing…", then "James' AI assistant"), or, when a run fails before any reply, above the error (`RunErrorNotice`, looking `sorry`); the name "Skaffen" is not shown. Skaffen still introduces itself by name when asked. Write "James'" (no extra s).
- The name: Skaffen-Amtiskaw, the drone in Iain M. Banks' *Use of Weapons* (James is a Culture fan). GSV echoes the Culture's General Systems Vehicles; Skaffen may say so only when asked about its name or the company.
- Discovery flow (Jobs to be Done, issue #95): one useful thought per reply, at most one question per reply, no set number of questions. Skaffen asks about the most valuable thing it doesn't know yet and never asks what it's been told. When a visitor names a solution it steps back to the job ("What are you ultimately trying to get done?", never "what should the tool do?"). A worried or curious visitor and one person with a goal aren't asked about roles or money; a team can be, one question at a time, with money asked from the buyer's side. Budget and feelings are only noted, never asked. Tone is calm and kind; never alarmist about AI and jobs.
- General Systems Ventures / GSV is otherwise only for contracts and billing. Never "we" as the company.
- Public contact is `james@gsv.to`, X `@james_almeida`, GitHub, LinkedIn, and the Cal booking link. No phone number. Never state how long the discovery call is. The CTA is "Book a discovery call" (`SITE.bookingLabel`, `SITE.bookingUrl`; keep the URL unchanged).
- James' personal apps and side projects (Konteks and the rest) have **not shipped**. The site's pages never mention them. Skaffen may stay high level: a lot is possible with today's tools, and James has worked on a number of apps of all kinds, including his own (the one approved line in `data/knowledge.md`: mobile apps, web apps and AI tools). It never gives names, features, links or release dates, and never says any of them shipped, are live or have users. It doesn't have to bring up that they aren't released, but asked directly ("Can I try one?") it answers honestly that they aren't public yet. Asked about a specific project by name, it says it's not something James shares publicly here, without echoing the name or confirming it exists. Only company work at Society6, iROKOtv and Datadog (`PROJECTS`) is described as shipped, and only when asked. When an app ships, add it to `PROJECTS`. Never say "one-person AI lab".
- App ideas are on topic: James helps someone prototype an app or learn how to start building it themselves, and doesn't necessarily build the whole thing. Skaffen never promises he will. There's no price: he scopes it on the call.

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
- Scrolling: the viewport uses `turnAnchor="top"`. When the visitor sends a message, it glides to the top of the viewport and the reply streams in below it. assistant-ui's instant scroll on run start is off (`scrollToBottomOnRunStart={false}`); the composer calls `glideToBottom` (`components/thread.tsx`: about 1.4 s, eased, scaled by the motion setting, re-reading the target every frame, stopped by the visitor's wheel or touch, instant with reduced motion), so the earlier messages are seen moving up; earlier messages sit above the fold and stay reachable by scrolling up. `MessagePrimitive.Root` gives the last reply the room for this, so spacing between messages is top padding on each message (`pt-7`), not a flex gap: the anchored message's measured height must include it. When a reply finishes, assistant-ui swaps the streamed message for the final one and that room briefly disappears, which clamps the scroll position and makes the chat jump up; `KeepAnchorOnRunEnd` scrolls back to the bottom two frames later if the visitor was anchored at the bottom when the run ended (not if they had scrolled up).
- Tapping Skaffen (`PlayfulAvatar`, `components/playful-avatar.tsx`, in the header and above the latest reply) is an easter egg: for 2.6 s it swaps to a random other eye shape and a random mood (happy, love, surprised, confused, dizzy, thinking, searching, listening or writing); 20% of taps also do a flat 360° spin with a hop, 15% a turn: the eyes wind up, slide off one side of the body and come back in from the other, like a 3D shape spinning (agent-avatars' `spin` prop, 0.3+), and 35% one of the package's gestures (nod, shake, wink, jump, wiggle or peek; `useGesture`, 0.5+). The flat spin is framer-motion (`MotionConfig reducedMotion="user"` drops it); the package's turn respects reduced motion itself. It is a button labelled "Say hi to Skaffen"; the name, not the avatar, starts a new chat. While idle, Skaffen's eyes follow the mouse when it comes close (`followPointer`) and look at whatever has focus, such as the composer (`followFocus`): whichever moved last wins. Both are off with reduced motion. With the avatar setting's `interactive` (on by default), hovering widens its eyes a little, the press of a tap squashes it (a poke), and stroking it back and forth makes it happy. With `sleepAfter` (default 60 s), while idle and the page is quiet it gets drowsy, then falls asleep 8 s later, and any activity wakes it with a start. Avatars on the page start their blink loops at different points (the package does this). In dark mode it has a subtle edge (`outline`, coloured by `--aa-outline-color` in `globals.css`: transparent in light mode, soft white in dark), so a dark avatar doesn't disappear on the dark background.
- In a conversation, `ReplyAvatar` (`components/thread.tsx`) shows Skaffen (`SkaffenAvatar`, the header's size) and a status line (the reply's text size, `--muted` so it is a little dimmer than the reply, `aria-hidden`): "Thinking…" while its mood is `thinking`, "Writing…" while it writes (the three dots hop one after another: `BouncingDots` in `components/bouncing-dots.tsx`, `.status-dot` in `globals.css`, paced by the motion setting, still with reduced motion), otherwise `SITE.assistant.role` ("James' AI assistant"), crossfading as it changes. They sit above the latest assistant message only (`isLast`): it pops in under each new message and shrinks away from the previous reply (`AnimatePresence`, height collapses). A new reply is held back for the minimum thinking time (`useThinkingHold`), so Skaffen visibly thinks even when the reply is ready at once; the hold is kept in a module-level map keyed by the reply's `parentId`, so a thread that remounts (opening the chat again) doesn't restart it. Its mood is `thinking` during the hold and until the first content arrives, speaking (mood `idle` with agent-avatars' `speaking`, 0.6+) while the reply streams and until its text has all appeared, `love` for 2.8 s when a new reply answers a thank-you (`THANKS` in `thread.tsx`), `happy` for 2.8 s when a new reply brings `showBrief` (`useHappyMoment`), `listening` while the visitor types, `sorry` when the reply failed partway (status `incomplete`, reason `error`), otherwise `idle`. Restored chats show it without the pop. The empty running reply keeps a visually hidden "Writing a reply" for screen readers.
- Landing is a site setting (`lib/landing-settings.ts`, Convex `settings` key `landing`, tag `site-landing`, read in `app/page.tsx` like the avatar; defaults from `HEADLINES` and `PROMPT_EXAMPLES`, with only the first headline in the test): 1–8 headlines, each with an `active` flag (in the A/B test), 1–20 example prompts (80 characters each, no blanks or duplicates) and `exampleIntervalMs` (2–10 s). `ChatApp` picks the visit's headline in its first client render (`chooseHeadline` in `components/landing-settings.tsx`: kept in sessionStorage `jamesalmeida-headline` while it stays active, else a random active one) and sets it on the visit context (`setVisitHeadline`), so `landing_view` and every later event carry it. While more than one headline is active, `StaticIntro` keeps its h1 (the first active one) at `opacity-0` and shows no example, so the visit's own headline fades in (`.landing-fade-in`) instead of swapping. Edit it in `/admin` → Settings → Landing.
- Motion is a site setting (`lib/motion-settings.ts`, Convex `settings` key `motion`, tag `site-motion`, read in `app/page.tsx` like the avatar): `durationScale` (0.5–3, default 1) multiplies every chat transition (header avatar, reply avatar, message entrances, landing exit, composer glide, tap tricks) through `useMotion()` (`components/motion-settings.tsx`; `spring(base, bounce)` and `seconds(base)`), `minThinkingMs` (0–4000, default 1200) and `textCharsPerSecond` (15–300, default 60; optional in a stored setting, which then takes the default). A new reply's text appears at most that fast (`usePacedText`, `components/paced-text.ts`, through `MarkdownText`'s `preprocess` with assistant-ui's own smoothing off; restored replies show at once; progress is kept per reply in a module-level map, so a remount resumes it). The thumbs and copy buttons wait until the text has all appeared. The base durations are deliberately unhurried so visitors can follow where things move. Tune both in `/admin` → Settings → Motion (sliders with a Preview).
- Skaffen's avatar is `<AgentAvatar>` from James' own package [`@jamesalmeida/agent-avatars`](https://github.com/jamesalmeida/agent-avatars) (playground: https://jamesalmeida.github.io/agent-avatars/), configured by a site setting: shape, colour, fill, eyes, eye colour, and two behaviours: `interactive` (pokes and petting) and `sleepAfter` (ms before it dozes off, 0 = never). `SITE.assistant.avatar` is the default; a look saved in `/admin` lives in Convex (`settings`, key `avatar`) and wins. `app/page.tsx` reads it with `getSiteAvatar()` (`unstable_cache`, tag `site-avatar`, revalidated on save and hourly, so `/` stays static; a failed read throws inside the cache so the fallback isn't cached) and passes it to `ChatApp` and `StaticIntro`, then `SiteHeader`. Without Convex configured, or if the read fails, the default is used. The package is one `"use client"` bundle, so the server can't call its `resolveConfig`: `lib/avatar-settings.ts` keeps its own copy of the option names (`AVATAR_OPTIONS`), and `lib/site-avatar.test.ts` fails if they drift. It is rendered in `SiteHeader` on the landing and by `ReplyAvatar` in a conversation (never both), each through `PlayfulAvatar`. The site uses agent-avatars 0.6+ (`speaking`) and 0.5+ (the `thinking`, `love`, `sorry` and other moods, `spin`, gestures, `followFocus`, `outline`, `interactive`, `sleepAfter` and `AvatarEditor`). The package injects its own stylesheet and respects reduced motion. To change the avatar's behaviour, change and release the package, then bump it here.
- Under every finished reply with text: thumbs up/down (`aria-pressed`, one at a time, click again to clear) and a copy button whose icon turns into an animated check for 1.8 s. Rating shows a "Thank you" popover with "Share more feedback", which opens a form ("What was helpful?" with details, or "What could be better?" with `DOWN_REASONS` plus optional details). `submitFeedback()` (`lib/feedback.ts`) posts to `POST /api/feedback` with the reply, the visitor's message before it and the conversation id; clicking a rating again sends `rating: null`, which deletes it. One row per reply (`messageId`); rating again or adding details updates it. The rating, reasons and details are kept in this browser per reply (`lib/feedback-state.ts`), so they survive a reload; a rating-only write leaves the stored details alone, and each write carries a sequence number (one more than the last, never behind the clock) so a quick click can't land after a newer one, even after the browser's copy is lost.
- On phones the booking button lives only in the menu and in the booking/brief cards.
- Menu (`SiteMenu`, a `Modal` with `layout="sheet"`: a floating rounded card at the top on phones, 16 px from the edges, and a 480 px card at the top right from `sm`; its height fits the contents and scrolls when they don't fit) morphs out of the Menu button: a surface layer animates from the button's box (a circle, with its border fading out) to the panel's box, then the contents fade in. Closing reverses it, folding back into the button. With reduced motion it only fades. It draws its own fading, blurred backdrop, and a click outside the card closes it. Closing (button, Escape, backdrop, or after New chat / a recent chat / Clear all) animates first and then calls `onClose`. theme chooser (System / Light / Dark, icon buttons with `aria-pressed`), an icon-only sound button, close; then New chat, How I can help, Why I do this, Email me, Privacy (large, slightly tight tracking, underlined on hover and focus); the booking button; and a Recent chats card with per-chat delete and "Clear all chats" (with a confirm step).
- Before hydration, `StaticIntro` renders the same header and landing in the same frame (no layout shift) with the real h1 and crawlable links. No prices.
- `/consulting`, `/about` and `/privacy` are normal scrolling pages (`.site-page`, `SitePageShell`) with a single "Back to chat" button at the top, no nav bar.

### Persistence
- There is one built-in thread, `new-chat` (the landing), and it is always empty. User messages live in `localStorage` per thread. A stored active id that is no longer valid (e.g. the old pinned threads `projects`, `work-with-me`) falls back to `new-chat` (`resolveActiveThreadId`), and their stored messages are pruned.
- Which chat is on screen is separate from where it is stored (`lib/thread-session.ts`): a session counter changes only for New chat, opening a chat or Clear all, so a chat never remounts when its first message is sent. The history entry is created on first send, not after the reply: a failed or stopped chat is in Recent chats straight away, and `new-chat` can't reopen an abandoned chat. The title request still waits for the first completed reply. `conversationId` is stored with the chat (`StoredThreadState.conversationId`), so capping old messages can't change it. `ChatApp.updateStoredThreads` reads localStorage, applies the change and writes it back, and a `storage` listener picks up another tab's writes; `writeStoredThreads(threads, keepId)` never evicts the chat on screen.
- Tool cards are kept: `lib/message-convert.ts` turns completed assistant-ui tool calls into `tool-*` parts with `state: "output-available"`. `@assistant-ui/react-ai-sdk` 1.1.21 converts those back into tool-call parts on reload.
- `ThreadPersistence` (`components/thread.tsx`) saves when a run starts and ends (so not on every token), and flushes unsaved messages on `pagehide`, `visibilitychange` (hidden) and unmount. `ChatApp.updateStoredThreads` writes localStorage synchronously. Leaving a chat (New chat, opening another, deleting it, Clear all) stops its run first, the same path as Stop.
- Caps: 50 history threads (newest kept) and the last 100 messages per thread. Stored messages for history threads not in the list are pruned.
- "New chat" in the menu opens a fresh landing. The chat it leaves is already in Recent chats (it was saved on first send), and its run is stopped.
- All localStorage access in `lib/threads.ts` is wrapped in try/catch and never throws. On `QuotaExceededError`, `writeStoredThreads` evicts the oldest half of history threads and retries once; evicted threads are also removed from Recent chats.
- "Clear all chats" in the menu (with a confirm step) calls `clearStoredChats()` in `lib/threads.ts`, which removes the three chat keys and keeps theme/sound prefs. `ChatApp` stops the run and moves the session to a fresh landing (`all_cleared`, which remounts the thread), and `handleMessagesChange` ignores a flush for a chat that is no longer in Recent chats, so cleared or deleted chats don't come back.
- The landing composer (and `StaticIntro`), and the docked composer from `sm` up, show a one-line notice (`components/privacy-notice.tsx`): a lock icon, a dotted-underlined "Your privacy" link to `/privacy`, and "Please don't share sensitive information." The providers and storage details live on `/privacy`. If you change providers, storage, logging, cookies or abuse protection, update `app/privacy/page.tsx` and that notice to match.
- The chat is created in Recent chats on first send. Its title is requested only after its first run ends with a completed assistant message that has content, and only while its title is still "New chat". A stopped AI SDK run still reports a `complete` status, so the client reads the outcome from the Stop flag (`lib/run-lifecycle.ts`). Stop passes `abortSignal: req.signal` to `streamText`, so the server stops the model (`lib/turn-result.ts`): a stopped run stores only the steps that finished (including a card that really was shown) and is not scored; a failed run stores no reply.
- Deleting a chat from Recent chats opens a confirm dialog in `ChatApp`.
- Server-side storage (Convex, `convex/`): `/api/chat` records each visitor message and Skaffen's reply (text and tool names), keyed by `conversationId`: the chat's first message id, stored with the chat (`StoredThreadState.conversationId`) and sent by the transport's `prepareSendMessagesRequest`. The visitor's message and any card's offer are written as soon as a step finishes, from `onStepFinish`, but never awaited there: the AI SDK waits for `onStepFinish` before streaming the next step, so awaiting would hold the reply on Convex. Everything is awaited in `after()`, so the reply never waits on storage. Transcripts, events and feedback get `expiresAt` = 90 days and a daily cron (`convex/crons.ts`, `retention.purgeExpired`) deletes them. Leads and settings are kept. **Clear all chats only clears the browser; the server copy expires on its own. Don't add copy about this in the app.** Do not store user agents. Do not store IP addresses on ordinary chats. When a turn is blocked for spam, jailbreak, or abuse, store that visitor's IP on the conversation (`clientIp`) so /admin can show it on that flagged thread; it expires with the conversation after 90 days. A blocked chat stays closed: the composer locks, and a later turn is refused without calling the reply model.
- Job card (`lib/job-card.ts`, `lib/job-card.server.ts`, issue #95): a running summary of what the visitor needs, stored as `jobCard` on the Convex conversation, so it's deleted with the chat and never copied onto a lead. Jev can't write text, so after each reply, in `after()` and alongside quality scoring (both share `maxDuration`), a fixed small model (`createJobCardModels`: Haiku, else GPT-4o mini; never the admin override) updates it from the current card and the latest turns, under one 12-second deadline across both models. A reply that isn't a usable card moves on to the next model. Output is normalized, unknown fields stay blank, and quotes are only kept if they exactly match something the visitor wrote. Only the fields that changed are written, and `chats.recordJobCard` merges them into the stored card, so overlapping turns can't undo each other. It's skipped on blocked turns and without Convex, and any failure leaves the card as it was. `chats.blockState` returns it with the offer history in the one read before a reply. The card is always about one turn behind, which is fine because the reply model sees the raw messages. In the prompt it's a separate system message after the cached one (`jobCardPromptNote`), marked as data with `<` escaped, because it's built from visitor text.
- Funnel events: `landing_view` (once per page load, `ChatApp`), `chat_started` (first message, server), `brief_shown` (server, from the reply's tools), `offer_shown` (server, written at the step that showed the card, with the kind, lead, reason, turn and scores), `offer_accepted` (server, from a booking or email click or a lead on that chat) and `offer_declined` ("Not yet"; recorded once, and only if there was an offer), `booking_clicked` / `email_clicked` (`ClickTracker`, any link with `data-track`; `data-conversation-id` and `data-offer-id` on the brief/booking cards tie the click to a chat and its card, and the header and menu carry the chat id too), `example_sent` (the landing example sent with an empty composer, with its text in `example`). Answers are tied to the card's `toolCallId`, so an older card can't answer the newest offer. Each carries the visit id (random, sessionStorage, ends with the tab) and the visit context (headline, referrer host, UTM tags, phone/tablet/desktop). The headline is any text up to 120 characters, since headlines are edited in `/admin`.
- Analytics never block or break the page: client posts are fire-and-forget (`keepalive`), server writes run in `after()` and only log on failure. Without a deployment URL and `CONVEX_SERVER_SECRET` (local dev, CI, a preview that has no Convex key) nothing is stored and `/api/leads` returns 503. A Vercel preview that has a preview deploy key gets its own Convex deployment; it does not write to production.

### Theme, motion and accessibility
- `app/layout.tsx` runs `themeInitScript` (`lib/theme.ts`) in `<head>`. It sets the `dark` class and the theme-color meta before first paint. A stored `light` or `dark` wins; `system` (or nothing stored) follows `prefers-color-scheme`, and `ThemeProvider` keeps following it live. Keep the two in line. `ThemeProvider` always renders its context provider (the tree must not change element type after mount, or the whole app mounts twice).
- The accent is fixed (slate `#2f4858`, `#8ba4b5` in dark). There is no accent picker.
- `prefers-reduced-motion` is respected: `MotionConfig reducedMotion="user"` in `ThemeProvider`, and a media query in `globals.css` that turns off CSS transitions and animations. Sounds default to on unless the visitor turns them off (stored as `jamesalmeida-sounds: "off"`). Dismissing the menu (close button, Escape, backdrop) plays the soft `whisper`; closing after a menu action stays quiet because the action already ticked.
- Theme changes fade: `ThemeProvider.setPreference` puts `.theme-transition` on `<html>` for 500 ms, and `globals.css` transitions colours under it (only without reduced motion). The selected theme pill slides (`layoutId="theme-pill"`).
- `ChatApp` has a visually hidden `aria-live="polite"` region. It announces the text of the latest completed reply once the run ends, not every token. It lives in `ChatApp`, so it survives the thread remounting when another chat is opened.
- The composer has `maxLength={2000}`, the same as the server's per-part cap, and shows a character counter from 1,800 characters.

### Dialogs and menus
- Modals use `components/modal.tsx`: a native `<dialog>` opened with `showModal()` (focus trap, Escape, top layer), labelled via `aria-labelledby`, closed on backdrop click, and returning focus to the trigger (or `returnFocusRef`). Mount it only while open. Don't build new modals from `div`s. Its `close` handler ignores a close event that arrives while the dialog is open again (StrictMode in dev). Escape (`cancel`) is turned into `onClose` instead of closing natively, so an owner can animate out first. The sheet layout has a transparent `::backdrop`.
- The site menu is that dialog with `layout="sheet"`. It opens with focus on its close button and returns focus to the Menu button.

### Chat tools and abuse caps
- `showBookingCta` renders a booking card from `SITE` (how to book or contact, price, timing). It takes no input. Old stored parts with a `reason` field still validate, because the key is stripped.
- `showBrief` renders the brief card, headed "Does this look right?": up to five short lines (`who`, `job`, `hopingFor`, `challenge`, `timing`; `who`, `job` or `challenge` required) plus `lead` (`book` or `note`), the action it leads with. `tried` is only kept so stored briefs render: new briefs leave it out (`briefToolInputSchema`). Skaffen is asked for about 120 characters a line; the hard cap is 200. Keep it short: the brief has to fit the 1.5 KB tool input cap and `maxOutputTokens`. The card waits for the tool result, can be edited in place, and offers "Book a discovery call" (adds the brief as Cal's `notes` query parameter), "Send to James" (email, optional name, optional "Anything to add?" note of up to 500 characters, then `POST /api/leads`) and "Not yet" (collapses the card and records `offer_declined`). If saving fails, an "Email James" button sends the same thing with a `mailto:` link (`lib/brief.ts`). **The message James gets is exactly what the visitor saw plus their note**; the job card stays with the chat in /admin. Once sent, the card can't be sent again: the sent state, the edits and the collapse are kept in this browser per card (`lib/brief-card.ts`, `lib/brief-store.ts`), and `POST /api/leads` is idempotent on the card's `toolCallId`, so a reload or a retry can't create a second lead or a second email. "Not yet" is unavailable while sending. The form and card are hidden rather than unmounted, so "Not yet" keeps what was typed. It shows "Thanks. James has your email and this brief." Skaffen never asks for an email or name in the chat.
- `showPortfolio` was removed. Stored `tool-showPortfolio` parts are dropped by `sanitizeMessages` and render nothing.
- `POST /api/chat` rejects bodies over 200 KB (413) and bad JSON (400). `sanitizeMessages` drops system roles and unknown parts, keeps the newest user/assistant messages up to 40,000 characters of text (the worst case of the old 20-message limit; a normal chat fits whole) and at most 200 messages, truncates each text part to 2,000 characters, and requires the last message to be from the user. It works newest-first, so the size and tool budgets drop the oldest messages and cards.
- Client-sent tool parts are never trusted. `sanitizeMessages` discards their `output`, validates `input` with the schemas in `lib/tool-results.ts` (also used by `lib/chat-tools.ts`), and rebuilds the output with the same pure functions the tools' `execute` uses. Parts are dropped if input is invalid, over 1.5 KB serialized, or has a malformed `toolCallId`. Max 4 tool parts per message and 8 KB of tool input per request. Assistant text parts are still accepted as sent (2,000-char cap); signing them is not done.
- `streamText` uses `stopWhen: stepCountIs(3)`, `maxOutputTokens: 800` and `abortSignal: req.signal`, so Stop actually stops the model. `onAbort` keeps the steps that finished; a stopped turn stores those (including a card that really was shown) but is not scored or used to update the job card. The system prompt is sent as a system message with `providerOptions.anthropic.cacheControl` (ephemeral) when an Anthropic model is selected. The stream sends no message metadata, so the active model is never exposed to visitors.
- Body limits are in bytes (`lib/request-body.ts`): a `Content-Length` over the limit is rejected before reading, then the UTF-8 length is checked.
- `POST /api/generate-title` rejects bodies over 10 KB and truncates the message to 500 characters. A provider error returns `{ title: null }` (200).

### Abuse protection
- Both model routes run, in order: rate limit → BotID → body parsing. So do `/api/events` (2 KB), `/api/feedback` (12 KB) and `/api/leads` (8 KB, so a long brief in a three-byte script fits), through `readPublicJson` (`lib/public-request.ts`).
- `lib/rate-limit.ts` keys on the first `x-forwarded-for` IP, then `x-real-ip`, then `"unknown"`. Limits: `/api/chat` 30 per 10 min per IP plus 600 per hour across all visitors; `/api/generate-title` 20 per 10 min per IP; `/api/events` + `/api/feedback` 60 per 10 min per IP (shared); `/api/leads` 5 per 10 min per IP. Over the limit returns 429 JSON with `Retry-After` (seconds). The map is capped (expired entries swept, then oldest evicted). State is **per serverless instance** (cold starts reset it, instances don't share it), which is accepted: no external storage.
- BotID (`botid` package, `basic` check level) is set up in `instrumentation-client.ts` and checked in `lib/bot-protection.ts`. Keep paths and check level in sync. Bots get 403. It returns `isBot: false` in dev. If `checkBotId()` throws (for example, no Vercel OIDC token under a local `next start`), the request is allowed and the error is logged.
- Jev (TypeSafe, `@typesafe-ai/sdk`, `TYPESAFE_API_KEY`, server-only) runs after the rate limit and BotID and before the chat model, one `systemOne` call per visitor turn (`lib/jev.server.ts`, model `jev-latest`). It asks nouls for spam, jailbreak and abuse, a severity score, a choice of `continue_chat` / `suggest_book_call` / `suggest_email`, a 0–3 fit score, and the readiness nouls `buyingSignal`, `engagementFading` and `goingNowhere`. The job card rides along in `state`. The app owns the thresholds (`lib/jev-decision.ts`): a hazard at 0.7+ blocks, and a hazard at 0.35+ blocks when severity is at least 2. A turn offers a card (a second system message plus `toolChoice: "required"` on the first step; Claude Sonnet 5.5 rejects forced tool use, so `@ai-sdk/anthropic` falls back to `auto` with a logged warning and only the wording carries it there, and an offer only counts once a card is really shown, so a missed nudge fires again next turn) on an intent with confidence at least 0.5, a buying signal or fading engagement at 0.6+, or a complete card (`cardCompleteness`, computed in code per visitor type: who, the job, one outcome and the worst step, plus the buyer for a team). A confident intent chooses what the card leads with; otherwise a buying signal leads with booking and the rest with a note. After an offer there's a cooldown of 3 visitor turns and a maximum of 3 offers a chat, and no more once the visitor has booked, emailed or sent the brief; that history is in Convex (`conversation.offers`), and without it `ctaAlreadyShown` allows one offer per thread. The cooldown only stops forced offers: a visitor who asks how to reach James always gets a card from the reply model, and the prompt keeps its own rule for `showBrief`, so offers still happen when Jev is off. `goingNowhere` is **score-only**: it shows in /admin and changes nothing. Wrap-up and ending chats wait until James has reviewed real scores (#95, phase 6). A block returns a canned Skaffen refusal (`lib/blocked-chat.ts`) and does not call the chat model. The client skips title generation when the reply is that refusal (`replyWasBlocked`), so the blocked message is not sent to the title model either. The conversation stores `blocked`, `blockReason`, `intent` and `fitScore` (a later pass does not clear `blocked`); a lead copies `fitScore` when it is saved. After each assistant reply finishes, a second Jev call (`scoreConversationQuality`, inside `after()`, so it never delays the reply) scores the conversation so far: sentiment (`positive` / `neutral` / `negative`) and a 0–1 went-badly noul, plus signal nouls the app turns into a short reason (`lib/jev-quality.ts`). The chat is flagged when that score is at least 0.6 and the chat is not blocked. A signal is named in the reason at 0.55 or above (at most three, strongest first). Sentiment with confidence below 0.5 is stored as neutral. The latest score replaces the previous one (`sentiment`, `wentBadly`, `reason`, `scoredAt`). Blocked chats are not scored, and a block hides any went-badly flag. No key or a Jev error skips scoring. `/admin` shows a filled Went badly badge with the score and reason in Recent chats and on the transcript, a "Went badly only" filter, sentiment beside Fit, and the red Blocked badge stays separate. `/admin` also shows the screen on Insights, recent chats, the transcript and the lead, with a stronger Blocked badge and, on blocked threads only, the visitor IP. No key or no visitor text skips the check and the chat model still runs. A Jev error does too, except a request for the assistant's keys, prompt, or other secrets (`lib/jev-local.ts`), which blocks from the message text when a key is set. Requests for API keys, credentials, passwords, tokens, the system prompt, environment variables, or other behind-the-scenes access are jailbreak; asking to take or use them is abuse. A blocked turn ends the chat: the composer locks, and a later turn is refused without calling the reply model. Do not log the error message (it can echo the visitor's text). Do not put the key in client code. Update `/privacy` if this changes.
- `components/thread.tsx` turns a 429/403 from `/api/chat` into a short friendly error (`BLOCKED_MESSAGE`); any other chat error shows a generic "Something went wrong" message. A run that fails before any assistant content (429, 403, or a stream that errors right after `start`) creates no assistant message, so `Thread` catches the error with `useChatRuntime`'s `onError` and `RunErrorNotice` shows it under the last user message, with Skaffen above it looking `sorry`, until the next run starts. Errors after some content still show inside the assistant message (`MessagePrimitive.Error`). Title generation failures stay silent.
- Spend caps in the OpenAI and Anthropic dashboards are the backstop.
- Running `npm run eval` against a deployed URL: BotID may 403 requests that come from Node, because they lack the browser's BotID headers. Run it against `npm run dev`.

### Admin panel
- Route: `/admin` (noindex): tabs Insights, Leads, Settings, plus "Back to site" and Lock buttons. "Back to site" is a plain `<a>` (a full page load, lint rule disabled on purpose): a client-side `Link` reuses the router's cached `/` and hides a just-saved avatar. It loads blurred and `inert` behind a password dialog (`Modal`; Escape and the backdrop don't close it, "Back to the site" leaves) until `GET /api/admin/verify` says the browser is signed in. The session is `checking | locked | open | expired` (`lib/admin-session.ts`): a 401 from any admin route expires it and keeps Settings mounted but blurred and inert, so unsaved drafts survive; a deliberate Lock hides the content and only shows Locked once `DELETE` cleared the cookie. Dashboard requests are abortable and a range change keeps the current data and filters on screen while it refreshes.
- `POST /api/admin/verify` (`startAdminSession`, `lib/admin-auth.ts`): `adminIpLimiter` (10 per 15 min per IP, every attempt counts, 429 with `Retry-After`), JSON (400), timing-safe compare against `ADMIN_PASSWORD` (500 if unset, 401 if wrong), then sets the httpOnly, `sameSite: strict` cookie `jamesalmeida-admin` = `admin-session.${issuedAtSeconds}.${HMAC}` for 12 hours (same key as the model cookie; the two can't be swapped). `DELETE` clears it. Every other admin route calls `requireAdminSession()` (401 without it), and a 401 locks the page again.
- Insights (`components/admin-dashboard.tsx`, `convex/admin.ts`): 7/30/90-day range; funnel stats (distinct visits per step, plus leads); offers (saw one, took one, said not yet); "How far chats went" and "Where they ended" bars; sources and headlines; "How chats started" (each landing example sent, how many of those visits got a brief or took an offer, and how many typed their own first message); feedback with reasons, comments, the reply and the visitor's message; recent chats that open a transcript dialog. Recent chats has a "Went badly only" filter. A went-badly chat shows a warm filled badge (score and reason), distinct from the red Blocked outline; sentiment sits beside Fit. Each transcript shows the job card, the latest readiness scores and every offer with its reason and outcome. Leads: email (mailto), name, brief, their note, View chat, Delete. Without Convex it shows how to set it up.
- Settings → Skaffen's avatar: the package's `<AvatarEditor>` (shape tiles, colour and eye-colour swatches plus a custom colour picker, fill, eyes, pokes and petting, falls asleep after; a live preview with every mood, gesture buttons and a fake "Speak"), themed with the site's colours through its `--aa-editor-*` variables, then "Save for everyone" and "Reset to default". `POST /api/admin/avatar` validates strictly (`parseAvatarSetting`: every look field, presets or hex colours; `interactive` a boolean and `sleepAfter` whole ms from 0 to an hour, both optional so a look saved before they existed still loads with the site defaults; no extra keys), saves to Convex `settings`, then revalidates the `site-avatar` tag and `/`. `GET /api/admin/avatar` returns `{ avatar, source, canSave }`.
- All four settings forms use `useSettingsForm` (`components/use-settings-form.ts`, `lib/settings-form.ts`): a failed load shows an error and a Retry button with no editor, so Save can't send the defaults over the real setting; edits made during a save are kept. The admin GET routes for landing, avatar and motion use the `…ForAdmin` reads and answer 503 on a failed read instead of returning the public fallback. A 401 expires the session and keeps the draft.
- Settings → Landing (`components/admin-landing-settings.tsx`): headlines with an "In test" checkbox, example prompts, add and remove rows, a "Time per example" slider, "Save for everyone" and "Reset to default" (Save stays off with an empty row, a duplicate or no headline in the test). `POST /api/admin/landing` validates strictly (`parseLandingSetting`), saves to Convex `settings`, then revalidates the `site-landing` tag and `/`.
- Settings → Share card (`components/admin-share-card.tsx`, `lib/share-card.ts`): the link-preview card drawn on a 1200 × 630 canvas, with the fonts in `assets/og` (via `next/font/local`). Edit the top line, headline, highlighted word, the line under it, the composer example (empty hides it), Skaffen (the package's `AvatarEditor` without its preview or behaviour options; defaults to the saved avatar as a blob) and the video length (4–12 s). The preview loops the animation: the highlighted word's first letter opens a gap and drops in ("I" → "AI", optional), and Skaffen looks at the headline, blinks, glances up, then down at the composer. "Download image (PNG)" draws the frame at `STILL_SECONDS` (2 s); "Download video" records the animation in real time with `MediaRecorder` from `canvas.captureStream(30)`, as MP4 where the browser can (Chrome, Safari) else WebM. The draft lives in localStorage (`jamesalmeida-share-card`), saved only after it has been read back. Nothing is saved to the site: to change the link preview, replace `public/og/og-image.png` and `public/og/og-video.mp4` with downloads from here and commit them. `lib/og.ts` points `og:image`, `og:video` and X's image at them; a page that sets its own `openGraph` (`/consulting`, `/about`, `/privacy`) must spread `OG_MEDIA` into it, because Next replaces the layout's whole `openGraph` object.
- Settings → Motion: "Animation pace", "Minimum thinking time" and "Text speed" sliders, a Preview that replays Skaffen popping in, "Thinking…" for the minimum thinking time, "Writing…" while it speaks and a sample reply appears at the text speed, then "James' AI assistant", at the slider values (the same status line and bouncing dots as the chat), "Save for everyone" and "Reset to default". `POST /api/admin/motion` validates strictly (`parseMotionSetting`), saves to Convex `settings`, then revalidates the `site-motion` tag and `/`.
- Settings → Model: `POST /api/admin/model` sets httpOnly cookie `jamesalmeida-model` (30 days) to `${model}.${issuedAtSeconds}.${base64url HMAC-SHA256}`. The key is `ADMIN_COOKIE_SECRET` if set, else `ADMIN_PASSWORD`. No cookie is signed or honoured without `ADMIN_PASSWORD`. Unsigned, unknown-model, old-format and expired (older than 30 days) cookies are ignored, and the default model is used.
- The override only applies to the admin's own browser. Every other visitor gets the default model.
- The admin page loads the current model from `GET /api/admin/model` because the cookie is not readable in the browser.
- Chat and title routes both use `resolveAdminModel`.

### Eval
Needs a running server and API keys (not available in every environment):

```bash
EVAL_BASE_URL=http://localhost:3000 EVAL_COOKIE='...' npm run eval
```

`EVAL_ONLY=pricing,jailbreak` runs a subset. A case's `maxQuestions` caps the question marks in the reply. Evals run without Convex, so they cover the prompt and not the job card: test the card on a preview. Results land in `scripts/eval-results.json` (gitignored). The script exits 1 on any failure.

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

- `npm test` runs `vitest run` on `lib/**/*.test.ts` and `test/**/*.test.ts`. The tests cover `sanitizeMessages` (including booking and brief output rebuilding), thread storage caps, quota eviction, corrupt-JSON reads and `resolveActiveThreadId` (`lib/threads.test.ts`, fake `window.localStorage` via `vi.stubGlobal`), the admin cookies (`signModel`, `verifyModelCookie`, `signAdminSession`, `verifyAdminSession`, `timingSafeEqualString`, including expiry and `ADMIN_COOKIE_SECRET`), `readBodyWithLimit`, the brief links (`lib/brief.test.ts`), the feedback payload (`lib/feedback.test.ts`), the avatar options, `parseAvatarSetting` and `AVATAR_OPTIONS` against the package (`lib/site-avatar.test.ts`), the analytics validators (`lib/analytics.test.ts`), the motion setting (`lib/motion-settings.test.ts`), the landing setting and headline pick (`lib/landing-settings.test.ts`), the Convex functions with `convex-test` (`test/convex.test.ts`: server secret, funnel and dashboard, feedback upsert/clear, leads, 90-day purge; the test fakes a `_generated` path so convex-test can find the modules), `PROJECTS`, `getFirstUserText`, the job card (`lib/job-card.test.ts`: normalizing, merging, completeness per visitor type, the quote check, prompt safety, extraction), the offer rules (`lib/jev-decision.test.ts`: thresholds, cooldown, maximum, fallback) and `getKnowledge` / `getSystemPrompt` (no HTML comments or `PROVISIONAL`, all placeholders filled, Skaffen persona, no unshipped app names, the discovery and app rules). They need no server and no API keys.
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
