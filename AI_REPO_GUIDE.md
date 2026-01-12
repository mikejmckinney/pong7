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
- **Test Framework**: None configured yet
- **Linting**: None configured yet

## Repository Structure

```
/home/runner/work/pong7/pong7/
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
│       └── verify-checkpoints.yml
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
│       └── 08-file-structure.md           # Project file organization
├── AGENT.md             # Deprecated agent instructions (see AGENTS.md)
├── AGENTS.md            # Agent workflow and guidelines
├── install.sh           # Codespace/dotfiles installation script
└── test.sh              # Repository verification script
```

## Key Entry Points

**No implementation files exist yet.** Based on documentation, the planned structure is:

- **Main**: `index.html` (to be created)
- **Game Logic**: `js/game.js` (to be created)
- **Server**: `server/index.js` (to be created)

## Current State

This repository contains **documentation and planning only**. No actual game implementation exists yet. The repository is set up as a template with:
- Comprehensive game design documentation (10+ markdown files)
- AI agent configuration for development assistance
- Verification workflows

## Quickstart Commands

### Setup
```bash
# No dependencies to install yet (no package.json)
# Clone the repository
git clone https://github.com/mikejmckinney/pong7
cd pong7
```

### Verification
```bash
# Run repository verification
./test.sh
```

Expected output: Currently fails with 2 missing files (now being fixed):
- ✗ AI_REPO_GUIDE.md is missing (this file)
- ✗ README.md is missing

### Build
**Not applicable** - No build step required for vanilla JavaScript project.
Once implemented, the frontend will be static files served directly.

### Test
**Not configured yet** - No test framework exists.

### Lint
**Not configured yet** - No linter configured.

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

1. Phase 1: Core Pong gameplay (single-player vs AI)
2. Phase 2: Mobile touch controls, responsive design
3. Phase 3: Synthwave visuals and sound effects
4. Phase 4: Power-ups and special game modes
5. Phase 5: Local multiplayer (same device)
6. Phase 6: Database setup (Supabase)
7. Phase 7: Backend deployment (Railway)
8. Phase 8: Online multiplayer integration
9. Phase 9: Frontend deployment (GitHub Pages)
10. Phase 10: Testing, bug fixes, polish

## Related Files

- **Main Planning Doc**: `docs/prompts/README.md`
- **Agent Guidelines**: `AGENTS.md`
- **Onboarding Process**: `.github/prompts/repo-onboarding.md`
- **Copilot Setup**: `.github/prompts/copilot-onboarding.md`

## Notes for AI Agents

1. **Always read this file first** before making changes
2. **Update this file** when adding new commands, changing structure, or modifying conventions
3. **Follow** `.github/prompts/repo-onboarding.md` for comprehensive onboarding
4. **Refer to** `docs/prompts/` for detailed game specifications
5. **Run** `./test.sh` before considering work complete
6. **Remember**: This is currently a documentation-only repository
