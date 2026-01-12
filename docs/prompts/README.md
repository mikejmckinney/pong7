# Retro Mobile Pong Game - AI Agent Prompt

> **Role:** Act as a Senior Game Developer and Full-Stack Web Engineer. Build a complete, production-ready game with clean, modular code and comprehensive testing.

## Quick Summary

Build a **web-based Pong game** optimized for mobile devices with a retro synthwave aesthetic. The game includes single-player, local multiplayer, and online multiplayer modes with power-ups, leaderboards, and persistent player stats.

## Technology Stack

| Component | Technology | Hosting |
|-----------|------------|---------|
| Frontend | HTML5 Canvas, CSS3, Vanilla JS | GitHub Pages (free) |
| Backend | Node.js, Express, Socket.io | Railway (free tier) |
| Database | PostgreSQL | Supabase (free tier) |
| Audio | Web Audio API | - |

## Documentation Files

Read these files in order, or reference specific sections as needed:

| File | Description | When to Read |
|------|-------------|--------------|
| [`01-gameplay.md`](./01-gameplay.md) | Core mechanics, controls, game modes, power-ups | Phase 1, 4, 5 |
| [`02-ui-design.md`](./02-ui-design.md) | Synthwave visuals, color palette, typography, screens | Phase 3 |
| [`03-audio.md`](./03-audio.md) | Sound effects, background music, Web Audio API | Phase 3 |
| [`04-database.md`](./04-database.md) | Supabase setup, SQL schema, leaderboard queries | Phase 6 |
| [`05-backend.md`](./05-backend.md) | Node.js server code, Socket.io events, API endpoints | Phase 7 |
| [`06-frontend-multiplayer.md`](./06-frontend-multiplayer.md) | Client-side multiplayer integration | Phase 8 |
| [`07-deployment.md`](./07-deployment.md) | Railway, GitHub Pages, environment variables | Phase 7, 9 |
| [`08-file-structure.md`](./08-file-structure.md) | Project organization, file purposes | Reference |

## Implementation Phases

```
Phase 1:  Core Pong gameplay (single-player vs AI)     → See: 01-gameplay.md
Phase 2:  Mobile touch controls, responsive design     → See: 01-gameplay.md
Phase 3:  Synthwave visuals and sound effects          → See: 02-ui-design.md, 03-audio.md
Phase 4:  Power-ups and special game modes             → See: 01-gameplay.md
Phase 5:  Local multiplayer (same device)              → See: 01-gameplay.md
Phase 6:  Database setup (Supabase)                    → See: 04-database.md
Phase 7:  Backend deployment (Railway)                 → See: 05-backend.md, 07-deployment.md
Phase 8:  Online multiplayer integration               → See: 06-frontend-multiplayer.md
Phase 9:  Frontend deployment (GitHub Pages)           → See: 07-deployment.md
Phase 10: Testing, bug fixes, polish                   → See: Final Checklist below
```

## Key Requirements Summary

### Must Have
- [ ] 60fps gameplay on mobile devices
- [ ] Touch controls (drag to move paddle)
- [ ] Keyboard controls for desktop (W/S, Arrow keys)
- [ ] Single-player with 4 AI difficulty levels
- [ ] Local 2-player on same device
- [ ] Online multiplayer with matchmaking
- [ ] Private room codes for friends
- [ ] Global leaderboard with ELO ranking
- [ ] PWA support (installable, offline single-player)

### Visual Style
- Synthwave/retrowave aesthetic
- Neon colors (pink, cyan, purple) on dark background
- Glowing effects, particle trails
- Retro pixel fonts
- Optional CRT scanline effect

### Audio
- 8-bit/chiptune sound effects
- Sounds for: paddle hit, wall bounce, score, power-ups
- Optional synthwave background music

## Test Plan

Before deployment, test the following:

| Category | Test Cases |
|----------|------------|
| **Mobile Devices** | iOS Safari 13+, Android Chrome 80+, Samsung Internet |
| **Orientation** | Portrait → Landscape transitions mid-game |
| **Touch Controls** | Responsiveness, multi-touch (local multiplayer), gesture prevention |
| **Audio** | Sounds play after first interaction, volume controls work, mute persists |
| **PWA** | Installs to home screen, works offline (single-player), updates correctly |
| **Multiplayer Sync** | Paddle positions sync, ball state matches, scores agree |
| **Latency** | Playable up to 150ms latency, graceful degradation above |
| **Disconnection** | Reconnection window, forfeit handling, room cleanup |
| **Leaderboard** | Updates after match, displays correctly, pagination works |
| **Power-ups** | All 10 power-ups function correctly, duration timers accurate |
| **AI Difficulty** | Each level feels distinct, Impossible is beatable (barely) |
| **Battery** | Reduced effects when battery low (if implemented) |

---

## Final Checklist

Before considering the project complete:

- [ ] Game runs at 60fps on mid-range mobile devices
- [ ] Touch controls work on iOS Safari and Android Chrome
- [ ] All 9 sound effects implemented and playing
- [ ] AI works at Easy/Medium/Hard/Impossible levels
- [ ] Local multiplayer works (split-screen touch zones)
- [ ] Backend server deployed and accessible on Railway
- [ ] Supabase database tables created and connected
- [ ] Online matchmaking finds random opponents
- [ ] Room codes work for private matches
- [ ] Leaderboard displays top 100 players
- [ ] Player stats persist between sessions
- [ ] PWA installs to home screen
- [ ] Offline mode works for single-player
- [ ] README.md includes live demo URLs

## Quick Reference: Environment Variables

### Railway (Backend)
```
PORT=3001                    # Auto-set by Railway
FRONTEND_URL=https://[username].github.io/pong-game
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Keep secret!
```

### Frontend (config.js)
```javascript
const CONFIG = {
  BACKEND_URL: 'https://[app].up.railway.app',
  SUPABASE_URL: 'https://[project].supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...'  // Public, read-only
};
```

## Questions?

If you need clarification on any section, reference the specific file number and section heading. For example:
- "Clarify 01-gameplay.md → Power-Up System"
- "Clarify 05-backend.md → Socket Events"

---

## ✅ Verification Checkpoints

Each documentation file ends with a verification checkpoint. After reading each file:

1. **Answer the checkpoint questions** to confirm you've read the full content
2. **Record your answers** in `CHECKPOINTS.md` (create this file in the project root)
3. **Use the exact format** specified in each checkpoint

### CHECKPOINTS.md Template

Create this file and add your responses as you complete each documentation file:

```markdown
# Agent Verification Responses

## README.md
- Verified: ✓
- Deployment targets: [Frontend: ___, Backend: ___, Database: ___]
- Implementation phases: [___]
- Win score: [First to ___ points]

## 01-gameplay.md
- Verified: ✓
- AI difficulties: [___, ___, ___, ___]
- Power-ups: [___ total, examples: ___]
- Touch zones: [Left half → ___, Right half → ___]
- Player 1 keys: [___]

## 02-ui-design.md
- Verified: ✓
- Neon pink hex: [___]
- Title font: [___]
- UI screens: [___]
- Paddle colors: [P1: ___, P2: ___]

(Continue for each file...)
```

---

## ✅ Verification Checkpoint: README.md

After reading this README, confirm your understanding by answering:

1. What are the three deployment targets? (Frontend, Backend, Database)
2. How many implementation phases are there?
3. What is the winning score in a standard match?

**Response Format:**
```
README.md verified ✓
Answers: [Frontend: ___, Backend: ___, Database: ___] | [___ phases] | [First to ___ points]
Ready to proceed with Phase 1 → 01-gameplay.md
```
