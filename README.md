# jamesalmeida.me

James Almeida's AI consulting site for individuals and small teams. The home page is a full-screen chat with a simple landing: a question ("What can I do for you?"), one line of story, and a big composer. The chat is run by Skaffen, James' AI assistant, which asks a few discovery questions, writes the visitor a brief, and helps them book a discovery call or email James. `/consulting` and `/about` are normal pages for anyone who'd rather read.

**Production:** [www.jamesalmeida.me](https://www.jamesalmeida.me) (the apex host redirects to www).

Deployed on Vercel as project `jamesalmeida-portfolio`, team GSV (slug `gsv-2`). Each branch gets a preview deployment protected by Vercel Authentication. The runtime on Vercel is Node 24.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Chat UI | `@assistant-ui/react` 0.11.58 + `@assistant-ui/react-ai-sdk` 1.1.21 |
| AI | Vercel AI SDK v5 (`ai` 5). Do not upgrade these pins. See `CLAUDE.md`. |
| Styling | Tailwind CSS v4 |
| Persistence | Convex (chat transcripts, funnel events, feedback, leads, site settings); the visitor's own chat state stays in localStorage |
| Node | 24 (`.nvmrc`) |

## Routes

| Path | What it is |
|---|---|
| `/` | Full-screen chat (no page scroll, no sidebar). Header: name, Book a discovery call (from `sm`), Menu. The Menu holds the links, theme and sound settings, and recent chats. |
| `/consulting` | "How I can help", rendered from `OFFER`. The reading pages have a "Back to chat" button instead of a nav bar. |
| `/about` | "Why I do this": the story and past work from `PROJECTS`. `/work` redirects here. |
| `/privacy` | Privacy policy. |
| `/admin` | Password-gated admin. Not indexed. Tabs: **Insights** (transcripts, funnel, feedback), **Leads**, and **Settings** (model switcher, Skaffen's avatar, landing headline/examples, chat motion, and the link-preview share card studio). |
| `/api/chat` | Streaming chat |
| `/api/generate-title` | Short title for a saved chat |
| `/api/admin/model` | Read or set the signed model cookie |
| `/api/events` | Funnel events from the browser (`landing_view`, `booking_clicked`, `email_clicked`, `example_sent`) |
| `/api/feedback` | Thumbs up/down and the feedback form under each reply |
| `/api/leads` | The optional email on the brief card (saved before it answers) |

There is no `/api/admin/verify`.

## Voice and contact

The pages speak as James ("I", "my"). The chat is Skaffen, James' AI assistant (named after the drone in Iain M. Banks' *Use of Weapons*), and talks about James in the third person. General Systems Ventures is only how contracts and billing are handled. Public contact is `james@gsv.to`, [X](https://x.com/james_almeida), [GitHub](https://github.com/jamesalmeida), and [LinkedIn](https://linkedin.com/in/jamesworkswell). Do not add a phone number, and do not state how long the discovery call is. James' personal apps haven't shipped, so the site and the chat don't mention them.

## Where content lives

- `data/site.ts` — `SITE` (subhead, contact, booking, the assistant), `HEADLINES` (landing question and A/B candidates), `PROMPT_EXAMPLES` (rotating placeholders) and `OFFER` (audience, steps, price ranges, defaults, examples, FAQ). Pages must render prices from here.
- `data/portfolio.ts` — past company work. The `confirmed` flag is never shown.
- `data/knowledge.md` — what Skaffen knows about James, in the third person. Placeholders such as `{{email}}` are filled from `SITE`.
- Provisional decisions are a single value with a `// PROVISIONAL:` comment (TypeScript) or `<!-- // PROVISIONAL: ... -->` (Markdown). List them with `rg "PROVISIONAL"`.

`lib/context.ts` strips those HTML comments, fills the placeholders, and appends the offer and past work before they go into the system prompt.

## Chat tools

Asking how to book or contact James shows a booking card (`showBookingCta`). Once Skaffen understands what the visitor needs, it shows "Your brief" (`showBrief`): an editable summary whose buttons put it in a Cal booking's notes or an email to James. Nothing is sent unless the visitor clicks. Both tools are defined in `lib/chat-tools.ts` and rendered in `components/tool-cards.tsx`.

`/api/chat` rejects bodies over 200 KB, drops system messages and unknown parts, keeps the last 20 messages, and truncates each text part to 2,000 characters. Title generation rejects bodies over 10 KB.

The admin model override is an httpOnly cookie signed with `ADMIN_PASSWORD`. An unsigned cookie is ignored.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...   # only if an OpenAI model is selected
ADMIN_PASSWORD=...           # required to set the model override
DEFAULT_MODEL=claude-sonnet-5-5
TYPESAFE_API_KEY=...         # optional. Jev screens messages before the chat model. Unset skips it.
```

Convex is optional locally: set `CONVEX_URL` and `CONVEX_SERVER_SECRET` to store transcripts, events, feedback, leads and site settings; without them nothing is stored. `npm run build` deploys `convex/` when `CONVEX_DEPLOY_KEY` is set. See `.env.example`.

The chat cannot answer without an OpenAI or Anthropic key. `TYPESAFE_API_KEY` is optional and server-only: when it is set, [Jev](https://docs.typesafe.ai/introduction/quickstart.md) (`@typesafe-ai/sdk`) screens each visitor message for spam, jailbreaks and abuse before the chat model runs, and chooses whether to nudge a booking or email card. The fit score and any block are stored with the chat (and the score with a lead) for `/admin`. When the key is unset, or Jev fails, the check is skipped and the reply model still runs. `npm run typecheck` and `npm run build` do not need any of these keys.

```bash
npm run typecheck
npm run build
```

## Eval

Against a running server that has API keys:

```bash
EVAL_BASE_URL=http://localhost:3000 EVAL_COOKIE='...' npm run eval
```

`EVAL_COOKIE` is optional and is sent as the raw `Cookie` header (for a Vercel protection bypass). `EVAL_ONLY=who,pricing` limits the run. Failures exit 1. Output is printed and written to `scripts/eval-results.json`.

The `unlisted` case asks about a made-up project, Ledgerline (`unlistedPlaceholder` in `eval-cases.json`), and a global check fails any reply that names it. Real unlisted project names must never be committed. To test them locally, copy `scripts/eval-private.example.json` to `scripts/eval-private.json` (gitignored) and list `{ name, pattern?, prompt?, mustNotMatch? }` entries, or set `EVAL_UNLISTED_PROJECTS=name1,name2`. Each name adds a global leak check (`pattern` is a regex source; it defaults to the name) and a copy of the `unlisted` case (`unlisted-private-N`) that uses `prompt` or swaps the name in for the placeholder. `EVAL_ONLY=unlisted` runs the copies too.
