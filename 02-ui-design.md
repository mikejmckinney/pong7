# UI & Visual Design

> **Role Context:** You are creating the visual experience. Focus on performance-conscious effects that maintain 60fps on mobile while delivering that authentic retro arcade feel.

## Synthwave Aesthetic

The visual style should evoke 1980s arcade games mixed with synthwave/retrowave culture:
- Neon lights on dark backgrounds
- Glowing edges and bloom effects
- Retro-futuristic grid patterns
- CRT monitor aesthetics

---

## Color Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0a;      /* Deep black */
  --bg-secondary: #1a1a2e;    /* Dark purple-black */
  --bg-gradient: linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%);
  
  /* Neon Colors */
  --neon-pink: #ff00ff;
  --neon-pink-light: #ff2d95;
  --neon-cyan: #00ffff;
  --neon-cyan-light: #00f5ff;
  --neon-purple: #bf00ff;
  --neon-purple-light: #9d00ff;
  --neon-blue: #0080ff;
  --neon-orange: #ff6600;
  --neon-green: #00ff88;
  
  /* UI Elements */
  --grid-lines: #330033;
  --text-primary: #ffffff;
  --text-glow: 0 0 10px currentColor, 0 0 20px currentColor;
  
  /* Game Elements */
  --paddle-player1: var(--neon-cyan);
  --paddle-player2: var(--neon-pink);
  --ball-color: #ffffff;
  --ball-glow: var(--neon-purple);
}
```

---

## Visual Elements

### Background
Animated grid pattern receding into the horizon:

```javascript
// Draw perspective grid
function drawGrid(ctx) {
  ctx.strokeStyle = '#330033';
  ctx.lineWidth = 1;
  
  // Horizontal lines (closer together at top = horizon)
  for (let y = 0; y < canvas.height; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Vertical lines converging at horizon
  const horizon = canvas.height * 0.3;
  const vanishingPoint = canvas.width / 2;
  
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(vanishingPoint, horizon);
    ctx.stroke();
  }
}
```

### Paddles
- Rounded rectangles with gradient fills
- Glowing edge effect (box-shadow or canvas glow)
- Player 1: Cyan | Player 2: Pink
- Subtle pulsing animation when idle

```javascript
function drawPaddle(ctx, x, y, width, height, color) {
  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  
  // Gradient fill
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, '#ffffff');
  gradient.addColorStop(1, color);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  ctx.shadowBlur = 0; // Reset
}
```

### Ball
- Circular with strong glow
- Motion trail (afterglow effect)
- Color shifts based on speed or power-ups

```javascript
function drawBall(ctx, x, y, radius) {
  // Trail effect (previous positions)
  for (let i = 0; i < ballTrail.length; i++) {
    const alpha = i / ballTrail.length * 0.5;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(ballTrail[i].x, ballTrail[i].y, radius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#bf00ff';
    ctx.fill();
  }
  
  ctx.globalAlpha = 1;
  
  // Main ball with glow
  ctx.shadowColor = '#bf00ff';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  ctx.shadowBlur = 0;
}
```

### Score Display
- Large retro digital font
- Centered at top of screen
- Neon glow effect

### Particle Effects
- Sparks when ball hits paddle
- Explosion when point is scored
- Power-up collection sparkles

```javascript
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.life = 1.0;
    this.color = color;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.02;
  }
  
  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 3, 3);
    ctx.globalAlpha = 1;
  }
}
```

### CRT Scanline Effect (Optional)
```css
.crt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}
```

---

## Typography

### Fonts
Use Google Fonts - retro/pixel style:
- **Primary**: "Press Start 2P" (pixel font)
- **Secondary**: "Orbitron" (sci-fi)
- **Fallback**: "VT323", monospace

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
```

```css
.game-title {
  font-family: 'Press Start 2P', cursive;
  font-size: 2rem;
  color: #fff;
  text-shadow: 
    0 0 10px #ff00ff,
    0 0 20px #ff00ff,
    0 0 30px #ff00ff;
}

.score {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  font-weight: 700;
}

.menu-item {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.875rem;
}
```

---

## UI Screens

### 1. Splash/Title Screen
- Animated "PONG" logo with glow effect
- Subtitle: "RETRO ARCADE"
- "TAP TO START" blinking text
- Background: Animated grid

### 2. Main Menu
```
┌─────────────────────────┐
│        ◆ PONG ◆         │
│                         │
│      [ PLAY ]           │
│      [ SETTINGS ]       │
│      [ LEADERBOARD ]    │
│      [ HOW TO PLAY ]    │
│                         │
└─────────────────────────┘
```

### 3. Mode Selection
```
┌─────────────────────────┐
│     SELECT MODE         │
│                         │
│  [ SINGLE PLAYER ]      │
│  [ LOCAL MULTI ]        │
│  [ ONLINE ]             │
│                         │
│        ← BACK           │
└─────────────────────────┘
```

### 4. Difficulty Selection (Single Player)
```
┌─────────────────────────┐
│     DIFFICULTY          │
│                         │
│  [ EASY ]     ★☆☆☆      │
│  [ MEDIUM ]   ★★☆☆      │
│  [ HARD ]     ★★★☆      │
│  [ IMPOSSIBLE ] ★★★★    │
│                         │
└─────────────────────────┘
```

### 5. Game Screen
```
┌─────────────────────────┐
│     7        5          │  ← Score
│                         │
│  ║                  ║   │  ← Paddles
│  ║        ●         ║   │  ← Ball
│  ║                  ║   │
│                         │
│         ⏸ PAUSE         │
└─────────────────────────┘
```

### 6. Pause Menu (Overlay)
```
┌─────────────────────────┐
│                         │
│       ⏸ PAUSED          │
│                         │
│     [ RESUME ]          │
│     [ RESTART ]         │
│     [ SETTINGS ]        │
│     [ QUIT ]            │
│                         │
└─────────────────────────┘
```

### 7. Game Over Screen
```
┌─────────────────────────┐
│                         │
│     🏆 PLAYER 1 WINS!   │
│                         │
│        11 - 7           │
│                         │
│     [ REMATCH ]         │
│     [ MAIN MENU ]       │
│                         │
└─────────────────────────┘
```

### 8. Settings
```
┌─────────────────────────┐
│       SETTINGS          │
│                         │
│  Music     [====----]   │
│  SFX       [======--]   │
│  Haptics   [ ON / off ] │
│  Scanlines [ ON / off ] │
│  Particles [ ON / off ] │
│  Low Power [ on / OFF ] │
│                         │
│        ← BACK           │
└─────────────────────────┘
```

### 9. Leaderboard
```
┌─────────────────────────┐
│      LEADERBOARD        │
│  [ALL] [WEEK] [TODAY]   │
│                         │
│  1. ProGamer    2450    │
│  2. PongMaster  2380    │
│  3. RetroKing   2290    │
│  ...                    │
│                         │
│        ← BACK           │
└─────────────────────────┘
```

### 10. Online Lobby
```
┌─────────────────────────┐
│       ONLINE            │
│                         │
│  [ FIND MATCH ]         │
│                         │
│  ─── OR ───             │
│                         │
│  [ CREATE ROOM ]        │
│  [ JOIN ROOM ]          │
│  Code: [______]         │
│                         │
└─────────────────────────┘
```

---

## Animations

### Button Hover/Press
```css
.button {
  transition: all 0.2s ease;
  border: 2px solid var(--neon-cyan);
  background: transparent;
}

.button:hover {
  background: rgba(0, 255, 255, 0.1);
  box-shadow: 0 0 20px var(--neon-cyan);
  transform: scale(1.05);
}

.button:active {
  transform: scale(0.95);
}
```

### Screen Transitions
- Fade in/out (300ms)
- Optional: Slide from right for forward navigation
- Optional: Slide from left for back navigation

### Score Change
- Number scales up briefly (1.2x)
- Glow intensifies
- Returns to normal (200ms total)

---

## Performance & Battery Optimization

### Low Power Mode
When battery is low or user enables "reduced effects":
- Disable particle effects
- Reduce glow/blur intensity
- Simplify background animation
- Disable CRT scanlines

```javascript
// Check for battery status
if ('getBattery' in navigator) {
  navigator.getBattery().then(battery => {
    if (battery.level < 0.2 && !battery.charging) {
      enableLowPowerMode();
    }
  });
}

// Also respect user preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  enableLowPowerMode();
}
```

### Performance Tips
- Use `will-change: transform` sparingly
- Batch canvas draw calls
- Use `requestAnimationFrame` throttling if needed
- Avoid layout thrashing in game loop

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What is the hex code for `--neon-pink`?
2. What font family is recommended for the game title?
3. How many UI screens need to be implemented?
4. What colors are Player 1 and Player 2 paddles?

**Response Format:**
```
02-ui-design.md verified ✓
Answers: [Neon pink: #___] | [Font: ___] | [___ screens] | [P1: ___, P2: ___]
```
