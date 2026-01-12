# PONG7 - Retro Mobile Pong Game

> **Status**: 🚧 Planning Phase - Documentation Complete, Implementation Pending

A web-based Pong game optimized for mobile devices with a retro synthwave aesthetic. Features single-player AI, local multiplayer, online multiplayer with matchmaking, power-ups, and global leaderboards.

## 🎮 Features

### Gameplay Modes
- **Single Player**: Battle AI with 4 difficulty levels (Easy, Medium, Hard, Impossible)
- **Local Multiplayer**: Two players on the same device with split-screen touch controls
- **Online Multiplayer**: Real-time matchmaking or private rooms with friends

### Core Features
- ⚡ 60fps gameplay on mobile devices
- 📱 Touch-optimized controls with haptic feedback
- 🎨 Synthwave/retrowave visual aesthetic with neon colors
- 🔊 8-bit/chiptune sound effects
- 🏆 Global leaderboard with ELO ranking system
- 💪 10 unique power-ups (Speed Boost, Paddle Grow, Ball Split, etc.)
- 📴 PWA support - installable and works offline (single-player)

## 🛠️ Tech Stack

| Component | Technology | Hosting |
|-----------|------------|---------|
| Frontend | HTML5 Canvas, CSS3, Vanilla JS | GitHub Pages (free) |
| Backend | Node.js, Express, Socket.io | Railway (free tier) |
| Database | PostgreSQL | Supabase (free tier) |
| Audio | Web Audio API | - |

## 📁 Repository Structure

This is a **documentation-first** repository. Implementation will follow after setup is complete.

```
pong7/
├── docs/prompts/        # Complete game design documentation
│   ├── README.md        # Project overview and implementation phases
│   ├── 01-gameplay.md   # Core mechanics, controls, AI behavior
│   ├── 02-ui-design.md  # Visual design and color palette
│   ├── 03-audio.md      # Sound effects and music specs
│   ├── 04-database.md   # Database schema and queries
│   ├── 05-backend.md    # Server implementation details
│   ├── 06-frontend-multiplayer.md  # Client networking
│   ├── 07-deployment.md # Hosting and environment setup
│   └── 08-file-structure.md  # Project organization
├── .github/             # GitHub configuration
│   ├── copilot-instructions.md  # AI assistant guidelines
│   ├── agents/          # Custom agent definitions
│   ├── prompts/         # Onboarding instructions
│   └── workflows/       # CI/CD automation
└── AI_REPO_GUIDE.md     # Developer quick reference
```

## 🚀 Quick Start

### For Developers

```bash
# Clone the repository
git clone https://github.com/mikejmckinney/pong7.git
cd pong7

# Read the documentation
cat docs/prompts/README.md

# Verify repository structure
./test.sh
```

### For AI Agents

1. Read `AI_REPO_GUIDE.md` first for repository overview
2. Follow `.github/prompts/repo-onboarding.md` for comprehensive onboarding
3. Refer to `docs/prompts/` for detailed specifications

## 📋 Implementation Roadmap

- [x] Project planning and documentation
- [x] Repository structure and tooling
- [ ] Phase 1: Core Pong gameplay (single-player vs AI)
- [ ] Phase 2: Mobile controls and responsive design
- [ ] Phase 3: Synthwave visuals and sound effects
- [ ] Phase 4: Power-up system
- [ ] Phase 5: Local multiplayer
- [ ] Phase 6: Database setup (Supabase)
- [ ] Phase 7: Backend deployment (Railway)
- [ ] Phase 8: Online multiplayer integration
- [ ] Phase 9: Frontend deployment (GitHub Pages)
- [ ] Phase 10: Testing and polish

## 🎯 Game Specifications

- **Win Condition**: First to 11 points
- **Target FPS**: 60fps on mid-range mobile devices
- **Screen Support**: Portrait and landscape orientations
- **Power-ups**: 10 types with timed effects
- **AI Difficulty**: 4 levels with distinct behaviors
- **Multiplayer**: Socket.io with latency compensation

## 📖 Documentation

All documentation lives in `docs/prompts/`:

| File | Purpose | Read When |
|------|---------|-----------|
| `README.md` | Project overview, phases | First |
| `01-gameplay.md` | Core mechanics | Implementing game loop |
| `02-ui-design.md` | Visuals, colors, fonts | Implementing UI |
| `03-audio.md` | Sound effects | Adding audio |
| `04-database.md` | Schema, queries | Setting up database |
| `05-backend.md` | Server code | Building backend |
| `06-frontend-multiplayer.md` | Client networking | Adding multiplayer |
| `07-deployment.md` | Hosting setup | Deploying |
| `08-file-structure.md` | File organization | Reference |

## 🔧 Verification

Run the repository verification script:

```bash
./test.sh
```

This checks that all required files exist and follow the correct structure.

## 🎨 Design Preview

**Color Palette (Synthwave)**:
- Neon Pink: `#ff00ff`
- Neon Cyan: `#00ffff`
- Deep Purple: `#4a0e4e`
- Dark Background: `#0a0a0a`

**Typography**:
- Press Start 2P (retro pixel font)

## 🤝 Contributing

This is currently a planning repository. Once implementation begins:

1. Fork the repository
2. Create a feature branch
3. Follow the conventions in `AI_REPO_GUIDE.md`
4. Refer to design specs in `docs/prompts/`
5. Run `./test.sh` before submitting
6. Create a pull request

## 📄 License

To be determined

## 🔗 Links

- **Documentation**: [docs/prompts/README.md](docs/prompts/README.md)
- **Developer Guide**: [AI_REPO_GUIDE.md](AI_REPO_GUIDE.md)
- **Agent Guidelines**: [AGENTS.md](AGENTS.md)

## 📞 Contact

Created by [@mikejmckinney](https://github.com/mikejmckinney)

---

**Note**: This repository is in the planning phase. Implementation will begin after onboarding is complete and repository structure is verified.
