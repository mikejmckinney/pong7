# PONG7 - Retro Mobile Pong Game

> **Status**: ✅ Core Implementation Complete - Single Player, Local Multiplayer, and Power-ups Ready!

A web-based Pong game optimized for mobile devices with a retro synthwave aesthetic. Features single-player AI, local multiplayer, online multiplayer with matchmaking, power-ups, and global leaderboards.

![Main Menu](https://github.com/user-attachments/assets/6567fc33-2208-4972-86e7-ed6077daf94b)
![Gameplay](https://github.com/user-attachments/assets/58c9e44b-7730-471b-8353-0d33f7188622)

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
- 🏆 Global leaderboard with Elo ranking system
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

```
pong7/
├── index.html           # Main game HTML
├── manifest.json        # PWA manifest
├── service-worker.js    # Offline support
├── css/                 # Styles
│   ├── main.css         # Core styles
│   ├── animations.css   # Animations and effects
│   └── responsive.css   # Mobile/responsive design
├── js/                  # Game JavaScript
│   ├── config.js        # Game configuration
│   ├── utils.js         # Utility functions
│   ├── audio.js         # Sound effects (Web Audio API)
│   ├── controls.js      # Touch/keyboard/mouse controls
│   ├── physics.js       # Ball and collision physics
│   ├── ai.js            # AI opponent behavior
│   ├── powerups.js      # Power-up system
│   ├── renderer.js      # Canvas rendering
│   ├── storage.js       # Local storage for stats/settings
│   ├── screens.js       # Menu and UI screens
│   ├── multiplayer.js   # Socket.io client
│   └── game.js          # Main game loop
├── server/              # Backend server (Node.js)
│   ├── index.js         # Express + Socket.io server
│   ├── lib/             # Server utilities
│   └── *.test.js        # Server tests
├── tests/               # Test files
│   ├── unit/            # Unit tests (Jest)
│   └── e2e/             # End-to-end tests (Playwright)
├── docs/prompts/        # Complete game design documentation
└── AI_REPO_GUIDE.md     # Developer quick reference
```

## 🚀 Quick Start

### Play Locally

```bash
# Clone the repository
git clone https://github.com/mikejmckinney/pong7.git
cd pong7

# Install dependencies
npm install

# Start the app using the configured npm script
npm start
# or use any static server on port 8080, for example:
python3 -m http.server 8080
# or open index.html directly in browser (not recommended for all features)

# Open http://localhost:8080 in your browser
```

### Run Tests

```bash
# Unit tests
npm test

# Tests with coverage
npm run test:coverage

# Lint
npm run lint
```

### For AI Agents

1. Read `AI_REPO_GUIDE.md` first for repository overview
2. Follow `.github/prompts/repo-onboarding.md` for comprehensive onboarding
3. Refer to `docs/prompts/` for detailed specifications

## 📋 Implementation Roadmap

- [x] Project planning and documentation
- [x] Repository structure and tooling
- [x] Phase 1: Core Pong gameplay (single-player vs AI)
- [x] Phase 2: Mobile controls and responsive design
- [x] Phase 3: Synthwave visuals and sound effects
- [x] Phase 4: Power-ups and special game modes
- [x] Phase 5: Local multiplayer (same device)
- [ ] Phase 6: Database setup (Supabase)
- [x] Phase 7: Backend server (Node.js + Socket.io) ✅ Code complete
- [x] Phase 8: Online multiplayer integration ✅ Code complete
- [ ] Phase 9: Frontend deployment (GitHub Pages)
- [x] Phase 10: Testing, bug fixes, polish ✅ 185 tests passing

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

Run all tests:

```bash
npm test
```

Current test status: **185 tests passing** (113 frontend + 72 backend)

## 🎨 Design Preview

**Color Palette (Synthwave)**:
- Neon Pink: `#ff00ff`
- Neon Cyan: `#00ffff`
- Deep Purple: `#4a0e4e`
- Dark Background: `#0a0a0a`

**Typography**:
- Press Start 2P (retro pixel font)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the conventions in `AI_REPO_GUIDE.md`
4. Refer to design specs in `docs/prompts/`
5. Run `npm test` before submitting
6. Create a pull request

## 📄 License

MIT License

## 🔗 Links

- **Documentation**: [docs/prompts/README.md](docs/prompts/README.md)
- **Developer Guide**: [AI_REPO_GUIDE.md](AI_REPO_GUIDE.md)
- **Agent Guidelines**: [AGENTS.md](AGENTS.md)

## 📞 Contact

Created by [@mikejmckinney](https://github.com/mikejmckinney)

---

## Screenshots

| Main Menu | Settings | How to Play |
|-----------|----------|-------------|
| ![Menu](https://github.com/user-attachments/assets/6567fc33-2208-4972-86e7-ed6077daf94b) | ![Settings](https://github.com/user-attachments/assets/5231ea7a-3c07-42ec-9765-ac934161db01) | ![How to Play](https://github.com/user-attachments/assets/dde2f580-850f-4c62-a5b8-44b84b648922) |

| Gameplay | Leaderboard |
|----------|-------------|
| ![Gameplay](https://github.com/user-attachments/assets/58c9e44b-7730-471b-8353-0d33f7188622) | ![Leaderboard](https://github.com/user-attachments/assets/16cd6d0f-d589-40af-84a2-2676bc271418) |
