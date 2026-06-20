# Changelog

All notable changes to Mertle Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Unit tests for the diagram validation and repair engine (`projectSupport.js`)
- Global daily demo cap (`DEMO_DAILY_LIMIT`) to bound public-demo API spend
- Headless capture scripts and real screenshots of the wiring engine and app
- Accessibility labels on the wiring SVGs (`role="img"` + `aria-label`; grid marked decorative)

### Changed
- README/CLAUDE/deploy docs rewritten around the validation+repair pipeline
- Deployment standardized on Docker/Fly.io with a slimmer, native-dependency-free image

### Removed
- Dead SQLite database layer left over from the removed accounts feature
  (`better-sqlite3`, `bcryptjs`, `src/lib/server/db.js`)

## [1.0.0] - 2026-04-20

### Added
- Initial release of Mertle Bot
- AI-powered hardware project generation
- Interactive wiring diagrams with wiregen
- 5 skill levels (Monkey to Expert)
- Age-appropriate instructions
- Project history with local storage
- Wokwi simulation integration
- Clarification question flow
- Multiple UI themes
- Responsive design for mobile/desktop
- Rate limiting (30 requests/minute)
- Security headers (CSP, CORS)
- API key management
- Export functionality (copy to clipboard)
- Amazon parts links
- Code syntax highlighting

### Technical Features
- SvelteKit 2.0 + Svelte 5 frontend
- Anthropic Claude API integration
- Server-side rate limiting
- Same-origin security policy
- No user authentication (stateless)
- Local storage for preferences
- Production-ready build configuration
- Docker support
- Vercel/Railway deployment ready

## Pre-1.0.0 Development

### 2026-04-03
- Initial project setup
- Basic SvelteKit structure
- Claude API integration
- Wiring diagram prototype
- Skill level system
- Theme system

### 2026-03-20
- Project conception and planning
- Wiregen diagram system design
- Prompt engineering for hardware projects
- UI/UX design iterations