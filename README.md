# Mertle Bot

A SvelteKit web app that turns hardware project ideas into full build guides — wiring diagrams, parts lists, Arduino code, and Wokwi simulations — powered by Claude.

## Features

- **Build guide generation** — describe any electronics project, get back a complete guide with SVG wiring diagram, parts list, and ready-to-flash code
- **5 skill levels** — Monkey, Novice, Builder, Hacker, Expert — adjusts how Claude explains everything
- **Interactive wiring diagrams** — SVG diagrams for Arduino Uno/Nano/Mega, ESP32, and common components (LEDs, servos, sensors, LCDs, etc.)
- **Wokwi simulation** — generates a live Wokwi circuit sim link for supported builds
- **Clarification flow** — asks targeted questions before generating to improve accuracy
- **User accounts** — register, login, email verification, password reset, account lockout
- **Project management** — save builds to your account, organize into folders, version history
- **Cloud sync** — projects sync across sessions
- **6 themes** — Solder (default), Deep Sea, Phosphor, Amber, Arctic, Sakura
- **Rate limiting + security headers** — 30 req/min per IP, CSP, no `x-powered-by`

## Tech Stack

- **Frontend** — SvelteKit 2 + Svelte 5
- **Backend** — SvelteKit API routes (Node.js)
- **AI** — Anthropic Claude (claude-sonnet / claude-haiku via `@anthropic-ai/sdk`)
- **Database** — SQLite via `better-sqlite3` with WAL mode and auto-backup
- **Auth** — custom session-based auth with bcrypt, email verification, and CSRF tokens
- **Email** — nodemailer (SMTP) or Resend API
- **Deployment** — `@sveltejs/adapter-node`, Docker-ready

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com/settings/keys)

### Installation

```bash
git clone https://github.com/josephg29/mertlebot.git
cd mertlebot
npm install
cp .env.example .env.production
# Add ANTHROPIC_API_KEY to .env.production
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

Create `.env.production` (never commit this):

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Database (optional, defaults to ./data/app.db)
DATABASE_PATH=/path/to/app.db
DATA_DIR=/path/to/data/

# Email — choose one:
# Option 1: SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=yourpassword
SMTP_FROM=noreply@example.com

# Option 2: Resend
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# App
PUBLIC_APP_URL=https://yourdomain.com
BACKUP_RETAIN_DAYS=7
```

### Building for Production

```bash
npm run build
npm start
```

### Docker

```bash
docker compose up --build
```

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main build UI (hero, chat, wiring, settings)
│   ├── +layout.svelte        # Root layout with Navigation and auth store
│   ├── about/                # About page
│   ├── auth/                 # Auth pages (login, register, verify, reset)
│   ├── build/                # Dedicated build route
│   ├── contact/              # Contact page
│   ├── pricing/              # Pricing page
│   └── api/
│       ├── generate/         # Main build guide generation (SSE stream)
│       ├── clarify/          # Clarification questions
│       ├── simulate/         # Wokwi simulation generation
│       ├── auth/             # Auth endpoints (login, register, logout, verify, reset)
│       ├── projects/         # Project CRUD + sync
│       ├── folders/          # Folder management
│       ├── user/             # Profile, password, email, notifications
│       └── health/           # Health check
├── lib/
│   ├── server/
│   │   ├── auth.js           # Auth utilities (hashing, tokens, cookies, CSRF)
│   │   ├── db.js             # SQLite layer — migrations, all DB operations
│   │   ├── email.js          # Email sending (SMTP or Resend)
│   │   ├── llm-service.js    # Claude API wrapper
│   │   ├── prompts.js        # System prompts per skill level
│   │   └── wokwi.js          # Wokwi simulation helpers
│   └── wiregen/              # SVG wiring diagram components
│       ├── WiringCanvas.svelte
│       ├── boards/           # Arduino Uno, Nano, Mega, ESP32
│       └── parts/            # LED, servo, DHT22, LCD, button, etc.
└── app.css                   # Global styles + theme variables
```

## API Reference

### `POST /api/generate`
Streams a build guide via Server-Sent Events.

```json
{ "prompt": "LED blinker", "skill": 2, "age": 25, "clarifications": "..." }
```

### `POST /api/clarify`
Returns clarification questions for a prompt.

```json
{ "prompt": "temperature sensor" }
```

### `POST /api/simulate`
Generates a Wokwi simulation URL from a completed guide.

### `GET /api/health`
Returns `{ status: "ok" }`.

## Skill Levels

| # | Name | Audience |
|---|------|----------|
| 1 | MONKEY | 6-year-old, maximum hand-holding |
| 2 | NOVICE | 1-2 prior projects, friendly explanations |
| 3 | BUILDER | Comfortable with electronics, technical but accessible |
| 4 | HACKER | Experienced maker, concise and direct |
| 5 | EXPERT | Professional engineer, peer-level |

## License

MIT
