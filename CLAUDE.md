# Mertle — AI Electronics Project Assistant

## What This Is

Mertle is a SvelteKit app that takes a natural-language electronics project idea and produces: component selection, Arduino/ESP code, a wiring diagram, a step-by-step build guide, and an optional Wokwi simulation link. All generation is powered by the Anthropic API.

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes syntax) + Vite 6
- **Adapter**: `@sveltejs/adapter-node` — built output runs as `node build/index.js`
- **AI**: `@anthropic-ai/sdk`
- **State**: Stateless — no database. The API key comes from the `ANTHROPIC_API_KEY` env var; there are no user accounts.
- **Testing**: Vitest

## Dev Commands

```bash
npm run dev       # SvelteKit dev server
npm run build     # Production build → build/
npm run start     # Run production build
npm run test      # Vitest (single run)
npm run test:watch
```

Docker is also available via `docker-compose.yml`.

## Project Layout

```
src/
  hooks.server.js          # Same-origin check, rate limiter, daily demo cap, CSP headers — touches every request
  routes/
    +page.svelte           # Landing page
    build/+page.svelte     # Build UI (prompt, stream, wiring, guide)
    contact/               # Contact page
    api/
      generate/            # Main AI generation pipeline (SSE stream + repair)
      clarify/             # Follow-up clarification
      simulate/            # Wokwi simulation export
      key/                 # API key status (server-managed, read-only)
      health/              # Health check
  lib/
    server/
      config.js            # Reads ANTHROPIC_API_KEY from env
      llm-service.js       # Claude API wrapper + intent routing
      prompts.js           # All Anthropic prompt templates
      wokwi.js             # Wokwi diagram/simulation helpers
    wiregen/               # SVG wiring canvas components and layout logic
    projectSupport.js      # Diagram parsing, validation, repair, step/Markdown helpers
    InstructionBook.svelte # Step-by-step guide renderer
```

## Key Architecture Decisions

- **Mostly single-page**: The build experience lives in `src/routes/build/+page.svelte` with state managed in-component; `+page.svelte` is the landing page. There are no per-view sub-routes beyond `build/` and `contact/`.
- **Skill levels**: MONKEY / NOVICE / BUILDER / HACKER / EXPERT — passed into prompts to adjust verbosity and hand-holding.
- **API key**: Read from the `ANTHROPIC_API_KEY` env var via `src/lib/server/config.js`. There is no DB and no in-app key entry — `/api/key` only reports status (server-managed).
- **Validation + repair pipeline**: Generated guides flow through `summarizeSupport`/`validateDiagram`/`repairGuide` in `projectSupport.js` before the user sees them — see the README "How it works" diagram. This is the core asset; keep it covered by tests.
- **Rate limiting**: In-memory, per-IP, per-endpoint (generate 20/min). Resets on server restart — not suitable for multi-process deployments.
- **Daily demo cap**: In-memory global counter over the Anthropic-billed endpoints, configurable via `DEMO_DAILY_LIMIT` (default 300). Bounds spend on a public demo.
- **Same-origin enforcement**: All `/api/*` routes reject requests with a mismatched `Origin` header.

## Security Rules

- Never hardcode API keys — use the `ANTHROPIC_API_KEY` env var. `.env` is gitignored; keep it that way.
- All `/api/*` routes are same-origin-enforced and rate-limited by `hooks.server.js`. There is no auth/session layer — the app is stateless.

## Wokwi Integration

Wokwi simulation is only available for components listed in `SIM_SUPPORTED_COMPONENT_TYPES` (exported from `projectSupport.js`). The `wokwi.js` server module generates the `diagram.json` and `sketch.json` payloads.

## Testing

- Tests live in `src/tests/`.
- Run with Vitest.
- Priority target: the validation/repair engine in `projectSupport.js` (`validateDiagram`, `summarizeSupport`, `repairGuide`) and the part classifiers. Fixtures use the real `boardPins.js` geometry so coordinates exercise the actual connectivity tolerance.
