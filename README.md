# jamesalmeida.me

Hiring portfolio first (remote building-with-AI role), AI-consulting lead tool second. The home page is a full-screen chat: visitors talk to James in first person, and the chat funnels them toward hiring him or working with him. `/consulting` and `/work` are normal pages for anyone who'd rather read.

**Production:** [www.jamesalmeida.me](https://www.jamesalmeida.me) (the apex host redirects to www).

Deployed on Vercel as project `jamesalmeida-portfolio`, team GSV (slug `gsv-2`). Each branch gets a preview deployment protected by Vercel Authentication. The runtime on Vercel is Node 24.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Chat UI | `@assistant-ui/react` 0.11.58 + `@assistant-ui/react-ai-sdk` 1.1.21 |
| AI | Vercel AI SDK v5 (`ai` 5). Do not upgrade these pins. See `CLAUDE.md`. |
| Styling | Tailwind CSS v4 |
| Persistence | localStorage (no database) |
| Node | 24 (`.nvmrc`) |

## Routes

| Path | What it is |
|---|---|
| `/` | Full-screen chat (no page scroll). The empty state has the Konteks card, starter prompts and works-in-progress chips; the header has Hire me and Book a call. `/?thread=work-with-me` opens that thread. |
| `/consulting` | Offer page, rendered from `OFFER` |
| `/work` | Work page, rendered from `PROJECTS` |
| `/admin` | Password-gated model switcher. Not indexed. |
| `/api/chat` | Streaming chat |
| `/api/generate-title` | Short title for a saved chat |
| `/api/admin/model` | Read or set the signed model cookie |

There is no `/api/admin/verify`.

## Voice and contact

The site speaks as James ("I", "my"). General Systems Ventures is only how contracts and billing are handled. Public contact is `james@gsv.to`, [X](https://x.com/james_almeida), [GitHub](https://github.com/jamesalmeida), and [LinkedIn](https://linkedin.com/in/jamesworkswell). Do not add a phone number, and do not state how long the intro call is. Personal apps are works in progress — not shipped, not in production.

## Where content lives

- `data/site.ts` — `SITE` and `OFFER` (audience, steps, price ranges, defaults, examples, FAQ). Pages must render prices from here. Hero/bio/contact and `konteksDemo` live here too.
- `data/portfolio.ts` — projects. The `confirmed` flag is never shown.
- `data/knowledge.md` — bio the bot reads. Placeholders such as `{{email}}` are filled from `SITE`.
- Provisional decisions are a single value with a `// PROVISIONAL:` comment (TypeScript) or `<!-- // PROVISIONAL: ... -->` (Markdown). List them with `rg "PROVISIONAL"`.

### Swap the Konteks demo clip

1. Drop an `.mp4`, `.webm`, `.gif`, `.png`, `.jpg`, or `.webp` in `public/media/`.
2. In `data/site.ts`, set `SITE.konteksDemo.src` to that path (for example `"/media/konteks-demo.mp4"`). Optional `poster` for video.
3. Leave `src: null` to keep the placeholder. The media shows in the General Chat empty state and on the Konteks project card. mp4/webm autoplay muted loop `playsInline`; images render as an `<img>`.

`lib/context.ts` strips those HTML comments, fills the placeholders, and appends the offer and portfolio before they go into the system prompt.

## Chat tools

Buying intent shows a booking card (`showBookingCta`). Asking about projects shows portfolio cards (`showPortfolio`). Both are defined in `lib/chat-tools.ts` and rendered in `components/tool-cards.tsx`.

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
```

The chat cannot answer without those API keys. `npm run typecheck` and `npm run build` do not need them.

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
