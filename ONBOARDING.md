# Agent Onboarding Instructions

Welcome! You are building a **Retro Mobile Pong Game** with online multiplayer.

## Before You Write Any Code

### Step 1: Read the Documentation
All project specifications are in this `docs/prompts/` folder:

| File | Purpose | Read When |
|------|---------|-----------|
| `README.md` | Project overview, tech stack, phases | **First** |
| `01-gameplay.md` | Game mechanics, controls, modes | Phase 1-5 |
| `02-ui-design.md` | Visual style, colors, screens | Phase 3 |
| `03-audio.md` | Sound effects, Web Audio API | Phase 3 |
| `04-database.md` | Supabase schema, queries | Phase 6 |
| `05-backend.md` | Server code, Socket.io events | Phase 7 |
| `06-frontend-multiplayer.md` | Client multiplayer integration | Phase 8 |
| `07-deployment.md` | Railway, GitHub Pages setup | Phase 7, 9 |
| `08-file-structure.md` | Project organization | Reference |

### Step 2: Complete Verification Checkpoints
Each documentation file ends with a **Verification Checkpoint**. You must:

1. Read the entire file
2. Answer the checkpoint questions
3. Record your answers in `CHECKPOINTS.md`

**Create `CHECKPOINTS.md` in this folder** with your responses before implementing each phase.

### Step 3: Follow the Phases
Implement in order. Don't skip phases.

```
Phase 1:  Core gameplay (single-player vs AI)
Phase 2:  Mobile touch controls, responsive design  
Phase 3:  Synthwave visuals and sound effects
Phase 4:  Power-ups and special game modes
Phase 5:  Local multiplayer (same device)
Phase 6:  Database setup (Supabase)
Phase 7:  Backend deployment (Railway)
Phase 8:  Online multiplayer integration
Phase 9:  Frontend deployment (GitHub Pages)
Phase 10: Testing and polish
```

---

## Project Structure

Build the game with this structure:

```
pong-game/
├── docs/prompts/          ← You are here (specs)
├── index.html             ← Main entry point
├── manifest.json          ← PWA manifest
├── service-worker.js      ← Offline support
├── css/
│   ├── main.css
│   ├── animations.css
│   └── responsive.css
├── js/
│   ├── config.js
│   ├── game.js
│   ├── renderer.js
│   ├── physics.js
│   ├── controls.js
│   ├── ai.js
│   ├── audio.js
│   ├── powerups.js
│   ├── multiplayer.js
│   ├── leaderboard.js
│   ├── storage.js
│   ├── screens.js
│   └── utils.js
├── assets/
│   ├── sounds/
│   ├── fonts/
│   └── images/icons/
├── server/
│   ├── index.js
│   └── package.json
└── README.md              ← Project readme with live demo links
```

---

## Rules

1. **DO** read documentation before implementing
2. **DO** answer verification checkpoints
3. **DO** implement in phase order
4. **DO** test each phase before moving on
5. **DO** deploy backend (Phase 7) before testing online multiplayer
6. **DON'T** skip checkpoints
7. **DON'T** implement features not in the spec
8. **DON'T** over-engineer solutions

---

## Start Now

Read `README.md` in this folder and answer its verification checkpoint.

```
Your first response should be:

README.md verified ✓
Answers: [Frontend: ___, Backend: ___, Database: ___] | [___ phases] | [First to ___ points]
Ready to proceed with Phase 1 → 01-gameplay.md
```
