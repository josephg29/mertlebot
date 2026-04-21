# Mertle — AI Electronics Project Assistant

## What This Is

Mertle is a SvelteKit app that takes a natural-language electronics project idea and produces: component selection, Arduino/ESP code, a wiring diagram, a step-by-step build guide, and an optional Wokwi simulation link. All generation is powered by the Anthropic API.

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes syntax) + Vite 6
- **Adapter**: `@sveltejs/adapter-node` — built output runs as `node build/index.js`
- **Database**: SQLite via `better-sqlite3` (sync API, no ORM)
- **AI**: `@anthropic-ai/sdk`
- **Auth**: Custom session cookies + CSRF tokens (`src/lib/server/auth.js`)
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
  hooks.server.js          # Auth guard, CSRF, rate limiter, CSP headers — touches every request
  routes/
    +page.svelte           # Single-page app — all UI lives here
    api/
      auth/                # Login/logout endpoints
      generate/            # Main AI generation pipeline
      clarify/             # Follow-up clarification
      simulate/            # Wokwi simulation export
      key/                 # API key read/write
      health/              # Health check
  lib/
    server/
      auth.js              # Session creation, CSRF derivation, password hashing
      db.js                # SQLite connection, migrations, session helpers
      config.js            # API key storage (DB-backed with env fallback)
      prompts.js           # All Anthropic prompt templates
      wokwi.js             # Wokwi diagram/simulation helpers
    wiregen/               # SVG wiring canvas components and layout logic
    projectSupport.js      # Step parsing, Markdown stripping, simulation eligibility
    InstructionBook.svelte # Step-by-step guide renderer
```

## Key Architecture Decisions

- **Single-page layout**: The entire UI is `src/routes/+page.svelte`. There are no sub-routes for different views — state is managed in-component.
- **Skill levels**: MONKEY / NOVICE / BUILDER / HACKER / EXPERT — passed into prompts to adjust verbosity and hand-holding.
- **API key**: Stored in SQLite `config` table, with `ANTHROPIC_API_KEY` env var as fallback. `config.json` is gitignored.
- **Rate limiting**: In-memory, 30 req/60s per IP, cleared every 5 min. Resets on server restart — not suitable for multi-process deployments.
- **CSRF**: Derived deterministically from the session token via `deriveCsrfToken`. All mutating requests to protected routes require the `x-csrf-token` header.
- **Same-origin enforcement**: All `/api/*` routes reject requests with a mismatched `Origin` header.

## Security Rules

- Never hardcode API keys — use `ANTHROPIC_API_KEY` env var or the in-app key UI.
- `config.json` and `.env` are gitignored. Keep them that way.
- New API routes under `/api/generate`, `/api/clarify`, `/api/simulate`, `/api/key` are automatically session-guarded by `hooks.server.js` — no extra middleware needed.
- If adding a new public API route, add its prefix to the `AUTH_PREFIXES` exclusion list in `hooks.server.js`.

## Database

- DB file lives at `data/app.db` (or `DATABASE_PATH` / `DATA_DIR` env vars).
- `getDb()` in `src/lib/server/db.js` returns a singleton connection and runs migrations on first call.
- Use the sync better-sqlite3 API (`.prepare().run()`, `.prepare().get()`, `.prepare().all()`). No async/await needed.

## Wokwi Integration

Wokwi simulation is only available for components listed in `SIM_SUPPORTED_COMPONENT_TYPES` (exported from `projectSupport.js`). The `wokwi.js` server module generates the `diagram.json` and `sketch.json` payloads.

## Testing

- Tests live in `src/tests/`.
- Run with Vitest. No E2E tests currently exist.
- Target: 80% coverage on server-side logic (prompts, auth, db helpers).
