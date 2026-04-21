# Mertle Bot

Mertle Bot turns hardware project ideas into detailed designs. Describe what you want to build, choose your skill level, and get AI-generated schematics, specs, and guides to bring it to life.

## Features

- **Instant Build Guides**: Describe any electronics project and get a complete wiring diagram, parts list, and ready-to-flash code
- **Skill-Based Adaptation**: Choose from 5 skill levels (Monkey → Expert) for tailored instructions
- **Interactive Wiring Diagrams**: Visual SVG diagrams with component placement and wire routing
- **Wokwi Simulation**: Generate working Wokwi simulations for testing
- **Project History**: Save and revisit previous builds
- **Clarification Flow**: Smart questions to refine project requirements
- **Responsive UI**: Works on desktop and mobile

## Tech Stack

- **Frontend**: SvelteKit 2.0 + Svelte 5
- **Backend**: Node.js with SvelteKit API routes
- **AI**: Anthropic Claude (Sonnet 3.5, Haiku)
- **Deployment**: Node adapter (compatible with Vercel, Railway, Fly.io, etc.)
- **Styling**: Custom CSS with theme support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key (from [console.anthropic.com](https://console.anthropic.com/settings/keys))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/josephg29/mertlebot.git
   cd mertlebot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env.production
   # Edit .env.production and add your Anthropic API key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
mertlebot/
├── src/
│   ├── routes/
│   │   ├── +page.svelte          # Main application UI
│   │   ├── api/
│   │   │   ├── key/              # API key management
│   │   │   ├── clarify/          # Clarification questions
│   │   │   ├── generate/         # Main build generation
│   │   │   └── simulate/         # Wokwi simulation generation
│   │   └── +layout.svelte        # Root layout
│   ├── lib/
│   │   ├── server/
│   │   │   ├── config.js         # Configuration management
│   │   │   ├── prompts.js        # AI system prompts
│   │   │   └── wokwi.js          # Wokwi simulation helpers
│   │   └── wiregen/              # Wiring diagram components
│   └── hooks.server.js           # Rate limiting & security headers
├── static/                       # Static assets
├── package.json
├── svelte.config.js
└── vite.config.js
```

## API Endpoints

### `POST /api/generate`
Generate a build guide from a project description.

**Request:**
```json
{
  "prompt": "Build an LED blinker",
  "skill": "NOVICE",
  "age": 25,
  "clarifications": "Additional context..."
}
```

**Response:** Server-Sent Events stream with markdown build guide.

### `POST /api/clarify`
Get clarification questions for a project prompt.

**Request:**
```json
{
  "prompt": "Build a temperature sensor"
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "board",
      "question": "Which board are you working with?",
      "hint": "e.g. Arduino Uno, ESP32, Nano...",
      "type": "choice",
      "options": ["Arduino Uno", "Arduino Nano", "..."]
    }
  ]
}
```

### `POST /api/simulate`
Generate a Wokwi simulation from a build guide.

**Request:**
```json
{
  "prompt": "LED blinker",
  "guide": "# LED Blinker\n\n## WIRING\n..."
}
```

**Response:**
```json
{
  "embedUrl": "https://wokwi.com/projects/.../embed",
  "projectUrl": "https://wokwi.com/projects/..."
}
```

### `GET/POST /api/key`
Manage API key configuration.

## Configuration

### Environment Variables

Create `.env.production` (never commit this file):

```bash
# Anthropic API key (required)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: DeepSeek API key (if adding DeepSeek provider)
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
```

### Skill Levels

1. **MONKEY**: 6-year-old level, simplest projects, maximum hand-holding
2. **NOVICE**: 1-2 projects experience, friendly explanations
3. **BUILDER**: Comfortable with electronics, technical but accessible
4. **HACKER**: Experienced maker, concise and direct
5. **EXPERT**: Professional engineer level, peer-level technical

### Themes

- **Deep Sea**: Blue/green oceanic theme
- **Phosphor**: Green terminal-style
- **Amber**: Warm orange/amber
- **Arctic**: Cool blue/white
- **Sakura**: Pink/white cherry blossom
- **Solder**: Default orange/black maker theme

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Railway

```bash
railway up
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "build/index.js"]
```

## Security

- Rate limiting: 30 requests per minute per IP
- CORS: Same-origin only
- Security headers: CSP, no `x-powered-by`
- API keys: Stored in `config.json` (local file) or environment variables
- No user authentication (stateless)

## Development

### Adding New Components

1. Add component to `src/lib/wiregen/parts/`
2. Update component types in `src/lib/server/prompts.js`
3. Add Wokwi mapping in `src/lib/server/wokwi.js`

### Adding New AI Providers

1. Add API key handling in `src/lib/server/config.js`
2. Create provider-specific generation logic
3. Update UI to support provider selection

### Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT License - see [LICENSE](LICENSE) file

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/josephg29/mertlebot/issues).

## Acknowledgments

- [Anthropic](https://www.anthropic.com) for Claude API
- [Wokwi](https://wokwi.com) for simulation platform
- [Svelte](https://svelte.dev) and [SvelteKit](https://kit.svelte.dev) teams