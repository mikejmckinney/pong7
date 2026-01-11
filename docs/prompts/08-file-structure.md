# File Structure

## Project Organization

```
pong-game/
│
├── index.html                 # Main entry point
├── manifest.json              # PWA manifest
├── service-worker.js          # Offline support
│
├── css/
│   ├── main.css               # Core styles, color palette
│   ├── animations.css         # Keyframes, transitions
│   └── responsive.css         # Media queries, mobile styles
│
├── js/
│   ├── config.js              # Environment URLs, API keys
│   ├── game.js                # Main game class, loop
│   ├── renderer.js            # Canvas drawing functions
│   ├── physics.js             # Ball movement, collision detection
│   ├── controls.js            # Touch and keyboard input
│   ├── ai.js                  # AI opponent logic
│   ├── audio.js               # Sound manager (Web Audio API)
│   ├── powerups.js            # Power-up spawning and effects
│   ├── multiplayer.js         # Socket.io client (online play)
│   ├── leaderboard.js         # Supabase queries, UI
│   ├── storage.js             # LocalStorage (offline stats)
│   ├── screens.js             # Menu, pause, game over screens
│   └── utils.js               # Helper functions
│
├── assets/
│   ├── sounds/                # Audio files (optional if using Web Audio)
│   │   ├── hit.wav
│   │   ├── score.wav
│   │   └── ...
│   ├── fonts/
│   │   └── PressStart2P.woff2
│   └── images/
│       ├── icons/             # PWA icons (192x192, 512x512)
│       │   ├── icon-192.png
│       │   └── icon-512.png
│       └── og-image.png       # Social sharing image
│
├── server/                    # Backend (separate deployment)
│   ├── index.js               # Main server file
│   ├── package.json           # Dependencies
│   └── .env.example           # Environment template
│
└── README.md                  # Project documentation
```

---

## File Descriptions

### Root Files

#### `index.html`
Main HTML file. Includes:
- Canvas element for game rendering
- UI containers for menus/overlays
- Script and stylesheet links
- Meta tags for mobile/PWA

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#0a0a0a">
  <meta name="description" content="Retro Pong with online multiplayer">
  
  <title>PONG - Retro Arcade</title>
  
  <link rel="manifest" href="manifest.json">
  <link rel="icon" href="assets/images/icons/icon-192.png">
  <link rel="apple-touch-icon" href="assets/images/icons/icon-192.png">
  
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/animations.css">
  <link rel="stylesheet" href="css/responsive.css">
  
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
</head>
<body>
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    <div id="ui-overlay"></div>
  </div>
  
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script src="js/config.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/audio.js"></script>
  <script src="js/controls.js"></script>
  <script src="js/physics.js"></script>
  <script src="js/ai.js"></script>
  <script src="js/powerups.js"></script>
  <script src="js/renderer.js"></script>
  <script src="js/multiplayer.js"></script>
  <script src="js/leaderboard.js"></script>
  <script src="js/storage.js"></script>
  <script src="js/screens.js"></script>
  <script src="js/game.js"></script>
</body>
</html>
```

#### `manifest.json`
PWA manifest for "Add to Home Screen" functionality.

```json
{
  "name": "PONG - Retro Arcade",
  "short_name": "PONG",
  "description": "Classic Pong with a synthwave twist",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "any",
  "background_color": "#0a0a0a",
  "theme_color": "#ff00ff",
  "icons": [
    {
      "src": "assets/images/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/images/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### `service-worker.js`
Enables offline play for single-player mode.

```javascript
const CACHE_NAME = 'pong-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/config.js',
  '/js/game.js',
  '/js/renderer.js',
  '/js/physics.js',
  '/js/controls.js',
  '/js/ai.js',
  '/js/audio.js',
  '/js/powerups.js',
  '/js/screens.js',
  '/js/storage.js',
  '/js/utils.js'
  // Note: multiplayer.js and leaderboard.js need network
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

### JavaScript Files

#### `js/config.js`
Environment configuration.

```javascript
const CONFIG = {
  BACKEND_URL: 'https://your-app.up.railway.app',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...',
  
  GAME: {
    WIN_SCORE: 11,
    BALL_SPEED: 5,
    PADDLE_SPEED: 8,
    POWERUP_INTERVAL: 12000
  }
};
```

#### `js/game.js`
Main game class orchestrating everything.

```javascript
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'menu'; // menu, playing, paused, gameover
    this.mode = null;    // single, local, online
    // ... initialization
  }
  
  start(mode, options) { /* ... */ }
  update(deltaTime) { /* ... */ }
  render() { /* ... */ }
  pause() { /* ... */ }
  resume() { /* ... */ }
  gameOver(winner) { /* ... */ }
}
```

#### `js/renderer.js`
All canvas drawing functions.

```javascript
const Renderer = {
  drawBackground(ctx, canvas) { /* grid pattern */ },
  drawPaddle(ctx, paddle, color) { /* glowing paddle */ },
  drawBall(ctx, ball, trail) { /* ball with glow and trail */ },
  drawScore(ctx, scores) { /* score display */ },
  drawPowerUp(ctx, powerup) { /* power-up icon */ },
  drawParticles(ctx, particles) { /* particle effects */ }
};
```

#### `js/physics.js`
Ball movement and collision detection.

```javascript
const Physics = {
  updateBall(ball, paddles, canvas) { /* ... */ },
  checkPaddleCollision(ball, paddle) { /* ... */ },
  checkWallCollision(ball, canvas) { /* ... */ },
  calculateBounceAngle(ball, paddle) { /* ... */ }
};
```

#### `js/controls.js`
Input handling for touch and keyboard.

```javascript
class Controls {
  constructor(canvas) {
    this.touches = {};
    this.keys = {};
    this.setupTouchListeners(canvas);
    this.setupKeyboardListeners();
  }
  
  getPlayer1Input() { /* ... */ }
  getPlayer2Input() { /* ... */ }
}
```

#### `js/ai.js`
AI opponent for single-player.

```javascript
class AI {
  constructor(difficulty) {
    this.difficulty = difficulty;
    this.reactionDelay = { easy: 300, medium: 150, hard: 50, impossible: 0 };
    // ...
  }
  
  update(ball, paddle) { /* returns target Y position */ }
}
```

#### `js/audio.js`
Sound effects using Web Audio API.

```javascript
class SoundManager {
  constructor() { /* AudioContext setup */ }
  paddleHit(position) { /* ... */ }
  wallBounce() { /* ... */ }
  scoreWin() { /* ... */ }
  scoreLose() { /* ... */ }
  // ...
}
```

#### `js/powerups.js`
Power-up system.

```javascript
class PowerUpManager {
  constructor() {
    this.active = [];
    this.effects = [];
  }
  
  spawn() { /* ... */ }
  collect(powerup, player) { /* ... */ }
  update(deltaTime) { /* ... */ }
}
```

#### `js/multiplayer.js`
Socket.io client for online play.
(Full implementation in `06-frontend-multiplayer.md`)

#### `js/leaderboard.js`
Supabase queries and leaderboard UI.

```javascript
class Leaderboard {
  constructor() {
    this.supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
  
  async getTop100() { /* ... */ }
  async getPlayerStats(username) { /* ... */ }
  render(container, data) { /* ... */ }
}
```

#### `js/storage.js`
LocalStorage for offline stats.

```javascript
const Storage = {
  saveLocalStats(stats) {
    localStorage.setItem('pongStats', JSON.stringify(stats));
  },
  getLocalStats() {
    return JSON.parse(localStorage.getItem('pongStats') || '{}');
  },
  saveSettings(settings) { /* ... */ },
  getSettings() { /* ... */ }
};
```

#### `js/screens.js`
Menu and overlay UI.

```javascript
const Screens = {
  showMainMenu() { /* ... */ },
  showModeSelect() { /* ... */ },
  showDifficultySelect() { /* ... */ },
  showOnlineLobby() { /* ... */ },
  showPauseMenu() { /* ... */ },
  showGameOver(winner, scores) { /* ... */ },
  showLeaderboard(data) { /* ... */ },
  showSettings() { /* ... */ }
};
```

#### `js/utils.js`
Helper functions.

```javascript
const Utils = {
  lerp(a, b, t) { return a + (b - a) * t; },
  clamp(value, min, max) { return Math.max(min, Math.min(max, value)); },
  randomRange(min, max) { return Math.random() * (max - min) + min; },
  generateUsername() { return 'Player' + Math.random().toString(36).substr(2, 6); }
};
```

---

### CSS Files

#### `css/main.css`
Core styles including color palette.

#### `css/animations.css`
Keyframe animations and transitions.

#### `css/responsive.css`
Media queries for different screen sizes.

---

### Server Files

See `05-backend.md` for complete server code.

---

## Loading Order

Scripts should load in this order (dependencies first):

1. `config.js` - Configuration
2. `utils.js` - Utilities (no dependencies)
3. `audio.js` - Sound (no dependencies)
4. `controls.js` - Input (no dependencies)
5. `physics.js` - Physics (no dependencies)
6. `ai.js` - AI (no dependencies)
7. `powerups.js` - Power-ups (no dependencies)
8. `renderer.js` - Drawing (no dependencies)
9. `multiplayer.js` - Network (depends on config, socket.io)
10. `leaderboard.js` - Leaderboard (depends on config)
11. `storage.js` - Storage (no dependencies)
12. `screens.js` - UI (depends on leaderboard)
13. `game.js` - Main (depends on all above)

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. How many JavaScript files are in the `js/` directory?
2. What file must be loaded last and why?
3. What is the purpose of `service-worker.js`?
4. What PWA icon sizes are required?

**Response Format:**
```
08-file-structure.md verified ✓
Answers: [___ JS files] | [Last file: ___, reason: ___] | [Service worker: ___] | [Icon sizes: ___x___, ___x___]
```
