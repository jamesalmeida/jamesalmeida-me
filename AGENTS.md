# AGENTS.md

`CLAUDE.md` is the canonical guide for this repo. The rules that matter on every change:

- Do not upgrade `@assistant-ui/react` (0.11.58), `@assistant-ui/react-ai-sdk` (1.1.21), `ai` (^5), or `@ai-sdk/react`. Run `npm run build` before pushing. Dev mode skips the checks Vercel runs.
- Voice is first person as James. GSV is only for contracts and billing. Public contact is `james@gsv.to`, X, GitHub, and LinkedIn. No phone number. Never state the intro-call length. Personal apps are works in progress, not shipped.
- `/` is a full-screen chat (`ChatApp`, no page scroll). Never turn it into a scrolling page; put portfolio content inside the chat (empty state, tool cards, header).
- Content lives in `data/knowledge.md`, `data/site.ts` (`SITE` and `OFFER`), and `data/portfolio.ts`. Do not duplicate prices. Do not render `confirmed`. Provisional values use a `// PROVISIONAL:` or `<!-- // PROVISIONAL: ... -->` comment (`rg "PROVISIONAL"`).
- No secrets in client code. API keys and `ADMIN_PASSWORD` stay in server env. The model override cookie is httpOnly and HMAC-signed.
- Node 24 (`.nvmrc`). CI runs `typecheck`, `lint`, `test`, and `build`. Unit tests: `npm test` (Vitest). Chat eval: `EVAL_BASE_URL=... EVAL_COOKIE=... npm run eval`. It needs a server and API keys.
