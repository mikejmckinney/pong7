# AI Repository Guide - Pong7

## What This Repo Does

This is a **web-based Pong game** repository focused on mobile devices with a retro synthwave aesthetic. The project includes single-player (with AI), local multiplayer, and online multiplayer modes featuring power-ups, leaderboards, and persistent player stats. This is a **planning and documentation repository** - no implementation exists yet.

## Tech Stack

- **Frontend**: HTML5 Canvas, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL (Supabase)
- **Audio**: Web Audio API
- **Deployment**: 
  - Frontend: GitHub Pages (free)
  - Backend: Railway (free tier)
  - Database: Supabase (free tier)
- **Build Tool**: None (vanilla JavaScript, no build step required)
- **Test Framework**: Jest (unit/integration), Playwright (E2E)
- **Linting**: ESLint
- **CI/CD**: GitHub Actions (`.github/workflows/ci-tests.yml`)

## Repository Structure

```
pong7/
├── .cursor/              # Cursor AI configuration
│   └── BUGBOT.md        # Bug reporting guidelines
├── .gemini/             # Google Gemini configuration
│   └── styleguide.md    # Code style guidelines
├── .github/             # GitHub configuration
│   ├── agents/          # Custom agent definitions
│   │   └── judge.agent.md
│   ├── copilot-instructions.md  # Copilot workspace instructions
│   ├── prompts/         # Onboarding prompts
│   │   ├── repo-onboarding.md
│   │   └── copilot-onboarding.md
│   └── workflows/       # GitHub Actions
│       ├── verify-checkpoints.yml
│       └── ci-tests.yml  # CI/CD pipeline
├── docs/                # Project documentation
│   └── prompts/         # Detailed game design documentation
│       ├── README.md                      # Main project overview
│       ├── 01-gameplay.md                 # Core mechanics, controls
│       ├── 02-ui-design.md                # Visual design specs
│       ├── 03-audio.md                    # Sound design specs
│       ├── 04-database.md                 # Database schema
│       ├── 05-backend.md                  # Server implementation
│       ├── 06-frontend-multiplayer.md     # Multiplayer client
│       ├── 07-deployment.md               # Deployment guides
│       ├── 08-file-structure.md           # Project file organization
│       └── 09-testing.md                  # Testing strategy and QA
├── AGENT.md             # Deprecated (required by test.sh); see AGENTS.md
├── AGENTS.md            # Agent workflow and guidelines
├── install.sh           # Codespace/dotfiles installation script
└── test.sh              # Repository verification script
```

## Key Entry Points

The game is fully implemented. Key files:

- **Main**: `index.html` - Entry point with canvas and script loading
- **Game Logic**: `js/game.js` - Main Game class orchestrating all systems
- **Config**: `js/config.js` - All game constants and settings
- **Physics**: `js/physics.js` - Ball movement and collision detection
- **AI**: `js/ai.js` - AI opponent with 4 difficulty levels
- **Controls**: `js/controls.js` - Touch, keyboard, mouse input handling
- **Power-ups**: `js/powerups.js` - 10 power-up types with effects
- **Renderer**: `js/renderer.js` - Canvas drawing with synthwave aesthetic
- **Screens**: `js/screens.js` - Menu and overlay UI (including online lobby)
- **Audio**: `js/audio.js` - Web Audio API sound effects
- **Storage**: `js/storage.js` - LocalStorage for settings and stats
- **Multiplayer**: `js/multiplayer.js` - Socket.io client for online play
- **Backend**: `server/index.js` - Node.js server for multiplayer

## Current State

The game is **fully playable** with the following features implemented:
- ✅ Single-player vs AI (4 difficulty levels)
- ✅ Local multiplayer (same device)
- ✅ Online multiplayer (requires backend server running)
- ✅ Synthwave visuals and sound effects
- ✅ Power-ups system (10 types) in Chaos Mode
- ✅ 3 game variants: Classic, Chaos Mode, Speed Run
- ✅ Touch, keyboard, and mouse controls
- ✅ Settings and stats persistence
- ✅ PWA support (service worker)

Not yet implemented:
- Database/leaderboard (requires Supabase)
- Production deployment (Railway for backend, GitHub Pages for frontend)

## Quickstart Commands

### Setup
```bash
# Clone the repository
git clone https://github.com/mikejmckinney/pong7
cd pong7

# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### Running Locally
```bash
# Start the frontend development server
npm start
# Frontend runs at http://localhost:8080

# In a new terminal, start the backend server
cd server && npm run dev
# Backend runs at http://localhost:3001
```

### Verification
```bash
# Run repository verification
./test.sh
```

Expected output: All checks should pass (21 passed, 0 warnings, 0 failed).

### Build
**Not applicable** - No build step required for vanilla JavaScript project.
The frontend consists of static files served directly.

### Test
```bash
# Run frontend unit tests
npm test

# Run frontend tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run backend tests
cd server && npm test
```

### Lint
```bash
# Lint frontend code
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Lint backend code (if configured)
cd server && npm run lint
```

### CI/CD
The CI pipeline runs automatically on every push. Check status:
```bash
# View recent CI runs
gh run list --limit 5

# View specific run details
gh run view <run-id>

# Get failed job logs
gh run view <run-id> --log-failed
```

## Testing Strategy

### Test Pyramid
- **Unit Tests (Many)**: Test pure functions in isolation (utils, physics, AI logic)
- **Integration Tests (Some)**: Test component interactions (game state, controls+physics)
- **E2E Tests (Few)**: Test critical user journeys (start game, complete match)

### Self-Healing CI Protocol
CI failures must be fixed before marking any task complete:

1. Check CI status: `gh run list --limit 1`
2. If failing, get logs: `gh run view <id> --log-failed`
3. Fix the issue in code
4. Commit and push the fix
5. Verify CI passes before continuing

See `.github/agents/self-healing.agent.md` for detailed protocol.

### Coverage Targets
- Core modules (utils, physics, ai): 80%+
- Overall project: 70%+

## Conventions

### File Organization
- Documentation goes in `/docs/prompts/`
- AI agent configs go in `.github/agents/`
- Installation scripts are in repository root

### Naming Conventions
- Use lowercase with hyphens for file names (e.g., `repo-onboarding.md`)
- Use `.md` extension for all documentation
- Use descriptive names that indicate purpose

### Documentation Style
- Use markdown with clear headers
- Include verification checkpoints at end of each doc
- Reference related docs with file numbers (e.g., "See 01-gameplay.md")

### Git Workflow
- Work on feature branches
- Keep commits atomic and descriptive
- Update AI_REPO_GUIDE.md when adding new commands or changing structure

## Where to Add Things

### New Documentation
- Game design docs → `/docs/prompts/`
- AI instructions → `.github/prompts/`
- Agent definitions → `.github/agents/`

### Implementation (When Started)
Based on `docs/prompts/08-file-structure.md`:
- HTML/CSS/JS source → root directory (index.html) and `/js/`, `/css/`, `/assets/`
- Backend code → `/server/`
- PWA files → root directory (manifest.json, service-worker.js)

## Troubleshooting

### Common Issues

**Issue**: `./test.sh` fails with "AI_REPO_GUIDE.md is missing"
**Solution**: This file should resolve that error.

**Issue**: `./test.sh` fails with "README.md is missing"
**Solution**: Create a README.md file following the project documentation.

**Issue**: Repository appears empty/no source code
**This is expected** - Repository currently contains only documentation. Implementation follows after onboarding.

### Verification Script
The `test.sh` script validates repository structure. Required files:
- AI_REPO_GUIDE.md (this file)
- AGENTS.md
- AGENT.md
- README.md
- install.sh
- .cursor/BUGBOT.md
- .gemini/styleguide.md
- .github/copilot-instructions.md
- .github/agents/judge.agent.md
- .github/prompts/copilot-onboarding.md
- .github/prompts/repo-onboarding.md

## Key Design Decisions

### Game Specifications
- **Win Condition**: First to 11 points
- **Frame Rate**: 60fps target using requestAnimationFrame
- **AI Levels**: Easy, Medium, Hard, Impossible (4 difficulty levels)
- **Power-ups**: 10 different types with timed effects
- **Controls**: Touch (mobile), keyboard (desktop), mouse (desktop)

### Architecture Choices
- **No Build Tools**: Vanilla JavaScript to minimize complexity
- **PWA Support**: Offline single-player with service worker
- **Real-time Sync**: Socket.io for multiplayer (WebRTC as optional fallback)
- **State Management**: Class-based architecture with Game as orchestrator

### Deployment Strategy
- **Frontend**: GitHub Pages (static hosting, free)
- **Backend**: Railway (Node.js hosting, free tier)
- **Database**: Supabase (PostgreSQL, free tier)

## Implementation Phases

1. ✅ Phase 1: Core Pong gameplay (single-player vs AI)
2. ✅ Phase 2: Mobile touch controls, responsive design
3. ✅ Phase 3: Synthwave visuals and sound effects
4. ✅ Phase 4: Power-ups and special game modes
5. ✅ Phase 5: Local multiplayer (same device)
6. ⏳ Phase 6: Database setup (Supabase) - Not started
7. ✅ Phase 7: Backend server (Node.js + Socket.io) - Code complete
8. ✅ Phase 8: Online multiplayer integration - Code complete
9. ⏳ Phase 9: Frontend deployment (GitHub Pages) - Not started
10. ✅ Phase 10: Testing, bug fixes, polish (185 tests passing: 113 frontend + 72 backend)

## Related Files

- **Main Planning Doc**: `docs/prompts/README.md`
- **Agent Guidelines**: `AGENTS.md`
- **Onboarding Process**: `.github/prompts/repo-onboarding.md`
- **Copilot Setup**: `.github/prompts/copilot-onboarding.md`
- **Testing Strategy**: `docs/prompts/09-testing.md`
- **Self-Healing CI**: `.github/agents/self-healing.agent.md`
- **CI Pipeline**: `.github/workflows/ci-tests.yml`

## Notes for AI Agents

1. **Always read this file first** before making changes
2. **Update this file** when adding new commands, changing structure, or modifying conventions
3. **Follow** `.github/prompts/repo-onboarding.md` for comprehensive onboarding
4. **Refer to** `docs/prompts/` for detailed game specifications
5. **Run** `npm test` to ensure all 113 frontend tests pass
6. **Run** `cd server && npm test` to ensure all 72 backend tests pass (27 integration + 45 unit)
7. **Run** `./test.sh` to verify repository structure
8. **Ensure CI passes** before marking tasks complete (self-healing protocol)
9. **Check** `.github/agents/self-healing.agent.md` if CI fails
10. **Game is playable**: Run `npm start` to test locally on http://localhost:8080
11. **Online mode requires**: Both frontend (`npm start`) and backend (`cd server && npm run dev`) running
