# AGENTS.md

`CLAUDE.md` is the canonical guide for this repo. The rules that matter on every change:

- Do not upgrade `@assistant-ui/react` (0.11.58), `@assistant-ui/react-ai-sdk` (1.1.21), `ai` (^5), or `@ai-sdk/react`. Run `npm run build` before pushing. Dev mode skips the checks Vercel runs.
- The site is all in on clients (individuals and small teams); no hiring CTAs. Pages speak as James in first person. The chat is Skaffen, James' AI assistant, which talks about James in the third person, is open about being AI and never claims to be James. GSV is only for contracts and billing (and Skaffen's name answer). Public contact is `james@gsv.to`, X, GitHub, and LinkedIn. No phone number. Never state the discovery-call length. James' personal apps haven't shipped: never mention them.
- `/` is a full-screen chat (`ChatApp`, no page scroll, no sidebar): a header, a landing (question + composer), then the conversation. Settings live in the Menu. Never turn it into a scrolling page.
- Content lives in `data/knowledge.md`, `data/site.ts` (`SITE`, `HEADLINES`, `PROMPT_EXAMPLES`, `OFFER`), and `data/portfolio.ts` (past company work only). Do not duplicate prices. Do not render `confirmed`. Provisional values use a `// PROVISIONAL:` or `<!-- // PROVISIONAL: ... -->` comment (`rg "PROVISIONAL"`).
- No secrets in client code. API keys and `ADMIN_PASSWORD` stay in server env. The model override cookie is httpOnly and HMAC-signed.
- Node 24 (`.nvmrc`). CI runs `typecheck`, `lint`, `test`, and `build`. Unit tests: `npm test` (Vitest). Chat eval: `EVAL_BASE_URL=... EVAL_COOKIE=... npm run eval`. It needs a server and API keys.
