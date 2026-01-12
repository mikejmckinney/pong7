# Gameplay Mechanics

> **Role Context:** You are implementing core game systems. Focus on smooth 60fps performance, responsive controls, and balanced gameplay.

## Core Pong Mechanics

### Ball Physics
- Ball starts at center, launches toward random player
- Ball speed increases gradually as rally continues
- Ball angle changes based on hit position on paddle:
  - Center hit → straight reflection
  - Edge hit → steeper angle
- Ball bounces off top/bottom walls
- Ball passing a paddle = point for opponent

### Scoring
- First to 11 points wins (configurable)
- Display score prominently at top of screen
- Brief pause after each point (1-2 seconds)
- Winning celebration animation

### Paddle Behavior
- Paddles move vertically only
- Paddle speed should feel responsive but not instant
- Paddles cannot move beyond screen boundaries

### Frame Rate
- Target 60fps using `requestAnimationFrame`
- Delta-time based movement for consistency

---

## Controls

### Touch Controls (Mobile)
```
Single Player:
- Touch anywhere on screen
- Drag up/down to move paddle
- Paddle follows finger position (not 1:1, smoothed)

Local Multiplayer:
- Left half of screen → controls left paddle
- Right half of screen → controls right paddle
- Each player uses one thumb
```

### Keyboard Controls (Desktop)
```
Player 1 (Left Paddle):
- W = Move up
- S = Move down

Player 2 (Right Paddle):
- Arrow Up = Move up
- Arrow Down = Move down
```

### Mouse Controls (Desktop)
- Move mouse vertically to control paddle
- Paddle follows mouse Y position (smoothed)
- Click to start game / navigate menus

### Haptic Feedback (Mobile)
Where supported (Navigator.vibrate API):
- Short pulse on paddle hit (20ms)
- Double pulse on scoring (20ms, pause, 40ms)
- Long pulse on game over (100ms)

```javascript
function vibrateOnHit() {
  if (navigator.vibrate) {
    navigator.vibrate(20);
  }
}
```

### Control Settings
- Sensitivity slider in settings menu
- Option to invert controls

### Gesture Prevention
Disable these browser behaviors during gameplay:
- Pull-to-refresh
- Scroll/pan
- Pinch-to-zoom
- Double-tap zoom

```javascript
// Prevent pull-to-refresh and scrolling during active gameplay
// Only enable during gameplay, not on menu screens, to preserve scrolling performance
let gameplayTouchHandler = null;
let currentCanvas = null;

function handleGameplayTouchMove(e) {
  e.preventDefault();
}

function enableGameplayTouchPrevention(canvas) {
  if (!gameplayTouchHandler && canvas) {
    canvas.addEventListener('touchmove', handleGameplayTouchMove, { passive: false });
    gameplayTouchHandler = true;
    currentCanvas = canvas;
  }
}

function disableGameplayTouchPrevention(canvas) {
  if (gameplayTouchHandler) {
    // Use stored canvas reference if provided canvas doesn't match
    const targetCanvas = canvas || currentCanvas;
    if (targetCanvas) {
      targetCanvas.removeEventListener('touchmove', handleGameplayTouchMove);
    }
    gameplayTouchHandler = null;
    currentCanvas = null;
  }
}

// Call enableGameplayTouchPrevention(canvas) when game starts
// Call disableGameplayTouchPrevention(canvas) when returning to menu
```

---

## Game Modes

### 1. Single Player (vs AI)

| Difficulty | Behavior |
|------------|----------|
| **Easy** | Slow reaction (300ms delay), random mistakes (20%), max speed 60% |
| **Medium** | Medium reaction (150ms delay), rare mistakes (5%), max speed 80% |
| **Hard** | Fast reaction (50ms delay), no mistakes, predicts ball trajectory |
| **Impossible** | Instant reaction, perfect prediction, max speed 100% |

AI Implementation hints:
- Track ball Y position
- Add intentional delay before reacting
- Add random offset to target position for mistakes
- Hard/Impossible: calculate where ball will intersect paddle X position

### 2. Local Multiplayer
- Two players, same device
- Split-screen touch zones
- No AI involved
- Same scoring rules as single-player

### 3. Online Multiplayer
- Real-time via WebSocket
- **Matchmaking**: Queue for random opponent
- **Private Rooms**: 6-character room codes (e.g., "ABC123")
- Host controls ball physics, syncs to opponent
- Opponent sends paddle position only
- Handle disconnections gracefully (forfeit or pause)
- Rematch option after game ends

---

## Power-Up System

Power-ups spawn at random intervals during gameplay (every 10-15 seconds).
They appear at random positions in the middle of the play area.
First player to hit the power-up with the ball collects it.

| Power-Up | Effect | Duration | Visual Indicator |
|----------|--------|----------|------------------|
| **Big Paddle** | Your paddle grows 50% | 10 sec | Green glow on paddle |
| **Small Enemy** | Opponent paddle shrinks 30% | 10 sec | Red glow on opponent |
| **Speed Ball** | Ball moves 50% faster | Until next point | Orange ball trail |
| **Slow Ball** | Ball moves 40% slower | 8 sec | Blue ball trail |
| **Multi-Ball** | Spawns 2 extra balls | Until all cleared | Rainbow ball colors |
| **Fireball** | Ball passes through paddle once | Single use | Fire particle effect |
| **Shield** | Barrier blocks one goal | Single use | Glowing wall behind paddle |
| **Reverse** | Opponent controls inverted | 8 sec | Purple screen flash |
| **Curve Shot** | Ball curves in flight | 5 sec | Spiral trail effect |
| **Slow Motion** | Entire game slows to 50% | 5 sec | Blue tint overlay |

### Power-Up Spawn Logic
```javascript
// Pseudo-code
const SPAWN_INTERVAL = 12000; // 12 seconds average
const SPAWN_VARIANCE = 3000;  // ±3 seconds

// Keep track of the active timeout so it can be cleared on mode changes / game reset
let powerUpSpawnTimeoutId = null;
let powerUpSpawnsActive = false;

function schedulePowerUp() {
  const delay = SPAWN_INTERVAL + (Math.random() - 0.5) * SPAWN_VARIANCE;
  powerUpSpawnTimeoutId = setTimeout(() => {
    spawnPowerUp();
    schedulePowerUp();
  }, delay);
}

// Call when a mode that uses power-ups starts (e.g., Chaos Mode)
function startPowerUpSpawns() {
  if (!powerUpSpawnsActive) {
    powerUpSpawnsActive = true;
    schedulePowerUp();
  }
}

// Call when switching modes or resetting the game to stop further spawns
function stopPowerUpSpawns() {
  if (powerUpSpawnsActive) {
    powerUpSpawnsActive = false;
    if (powerUpSpawnTimeoutId != null) {
      clearTimeout(powerUpSpawnTimeoutId);
      powerUpSpawnTimeoutId = null;
    }
  }
}
```

---

## Special Game Modes

### Classic Mode
- No power-ups
- Pure Pong experience
- First to 11 wins

### Chaos Mode
- Power-ups spawn every 5 seconds
- Multi-ball enabled from start
- First to 7 wins

### Speed Run
- Ball speed increases continuously (never resets)
- First to 5 wins
- Tests reaction speed

### Survival (Single Player Only)
- Endless mode vs AI
- Ball speeds up every 30 seconds
- How many points can you score?
- Leaderboard: highest score before losing

### Tournament Mode
- Best of 3 or best of 5 matches
- Bracket-style progression (future feature)
- Winner advances

### Gravity Mode
- Ball affected by gravity (curves downward)
- Adds vertical challenge to gameplay
- Optional wind gusts push ball left/right

### Obstacle Mode
- Barriers appear in the middle of the field
- Ball bounces off obstacles
- Obstacles spawn/despawn periodically

---

## Responsive Design

### Canvas Scaling
```javascript
// Maintain 4:3 or 16:9 aspect ratio
function resizeCanvas() {
  const container = document.getElementById('game-container');
  const aspectRatio = 4 / 3;
  
  let width = container.clientWidth;
  let height = width / aspectRatio;
  
  if (height > container.clientHeight) {
    height = container.clientHeight;
    width = height * aspectRatio;
  }
  
  canvas.width = width;
  canvas.height = height;
}
```

### Breakpoints
- Mobile portrait: 320px - 480px width
- Mobile landscape: 480px - 768px width
- Tablet: 768px - 1024px width
- Desktop: 1024px+ width

### Safe Areas
Account for notched phones (iPhone X+, Android) using CSS:
```css
.game-container {
  padding: env(safe-area-inset-top) 
           env(safe-area-inset-right) 
           env(safe-area-inset-bottom) 
           env(safe-area-inset-left);
}
```

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What are the four AI difficulty levels?
2. How many power-ups are defined, and name three of them?
3. In local multiplayer, which half of the screen controls which paddle?
4. What keyboard keys control Player 1's paddle?

**Response Format:**
```
01-gameplay.md verified ✓
Answers: [4 difficulties: ___, ___, ___, ___] | [___ power-ups, examples: ___, ___, ___] | [Left half → ___ paddle] | [Player 1 keys: ___]
```
