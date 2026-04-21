# Contributing to Mertle Bot

Thank you for your interest in contributing to Mertle Bot! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs
- Check if the bug has already been reported in [GitHub Issues](https://github.com/josephg29/mertlebot/issues)
- Use the bug report template
- Include steps to reproduce, expected behavior, and actual behavior
- Include browser/OS information if relevant

### Suggesting Features
- Check if the feature has already been suggested
- Use the feature request template
- Explain the problem the feature would solve
- Include mockups or examples if possible

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Anthropic API key (for testing AI features)

### Installation
```bash
git clone https://github.com/josephg29/mertlebot.git
cd mertlebot
npm install
cp .env.example .env.production
# Add your API key to .env.production
```

### Running Locally
```bash
npm run dev
```

### Building
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Main application
│   ├── api/                  # API endpoints
│   └── +layout.svelte        # Root layout
├── lib/
│   ├── server/              # Server-side logic
│   └── wiregen/             # Wiring diagram components
├── hooks.server.js          # Server hooks
└── app.html                 # HTML template
```

## Coding Standards

### JavaScript/TypeScript
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use async/await over callbacks where possible
- Add JSDoc comments for complex functions

### Svelte Components
- Use Svelte 5 syntax
- Keep components focused and reusable
- Use reactive statements appropriately
- Follow Svelte naming conventions

### CSS
- Use CSS custom properties for theming
- Follow BEM naming convention for complex components
- Keep styles scoped to components
- Use responsive design principles

### Git Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Fix bug" not "Fixes bug")
- Limit first line to 72 characters
- Reference issues and PRs

## Adding New Features

### New AI Providers
1. Add API key handling in `src/lib/server/config.js`
2. Create provider-specific generation logic
3. Update UI to support provider selection
4. Add to documentation

### New Components
1. Add to `src/lib/wiregen/parts/`
2. Update component types in `src/lib/server/prompts.js`
3. Add Wokwi mapping in `src/lib/server/wokwi.js`
4. Update documentation

### New Skill Levels
1. Add to `SKILL_CONTEXT` in `src/lib/server/prompts.js`
2. Update UI skill selector
3. Test with various project types

## Testing

### Manual Testing
- Test on different browsers (Chrome, Firefox, Safari)
- Test on mobile devices
- Test with different skill levels
- Test error cases (no API key, rate limiting)

### Automated Testing
(To be implemented)
```bash
npm test
```

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions
- Update API documentation if endpoints change
- Update deployment instructions if needed

## Deployment

### Before Merging
- Ensure the build completes successfully
- Test the production build locally
- Verify all features work without development tools

### After Merging
- The main branch auto-deploys to production
- Monitor for any deployment issues
- Update changelog if applicable

## Questions?

- Open an issue for questions about the codebase
- Join discussions in GitHub Issues
- Check existing documentation first

Thank you for contributing to Mertle Bot! 🐢