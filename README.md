# jamesalmeida.me

Portfolio and AI-consulting lead tool. Visitors can chat with James in first person, or read the consulting offer and portfolio as normal pages.

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
| `/` | Chat. Server HTML includes a static intro until the client hydrates. `/?thread=work-with-me` opens that thread. |
| `/consulting` | Offer page, rendered from `OFFER` |
| `/work` | Portfolio, rendered from `PROJECTS` |
| `/admin` | Password-gated model switcher. Not indexed. |
| `/api/chat` | Streaming chat |
| `/api/generate-title` | Short title for a saved chat |
| `/api/admin/model` | Read or set the signed model cookie |

There is no `/api/admin/verify`.

## Voice and contact

The site speaks as James ("I", "my"). General Systems Ventures is only how contracts and billing are handled. Public contact is `james@gsv.to`, [LinkedIn](https://linkedin.com/in/jamesworkswell), and [GitHub](https://github.com/jamesalmeida). Do not add a phone number, and do not state how long the intro call is.

## Where content lives

- `data/site.ts` — `SITE` and `OFFER` (audience, steps, price ranges, defaults, examples, FAQ). Pages must render prices from here.
- `data/portfolio.ts` — projects. The `confirmed` flag is never shown.
- `data/knowledge.md` — bio the bot reads. Placeholders such as `{{email}}` are filled from `SITE`.
- Provisional decisions are a single value with a `// PROVISIONAL:` comment (TypeScript) or `<!-- // PROVISIONAL: ... -->` (Markdown). List them with `rg "PROVISIONAL"`.

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
DEFAULT_MODEL=claude-sonnet-4-5
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
