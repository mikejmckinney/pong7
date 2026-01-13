# Testing & Quality Assurance

> **Role Context:** You are implementing the testing framework for the Pong game. Focus on test pyramid strategy, automated testing, and self-healing CI workflows.

## Overview

This project follows a **multi-layered testing strategy** with automated CI/CD pipelines that ensure code quality before deployment.

### Testing Philosophy

```
┌─────────────────────────────────────────────┐
│                 E2E Tests                   │  ← Few (critical paths)
│              (Playwright/Puppeteer)          │
├─────────────────────────────────────────────┤
│            Integration Tests                │  ← Some (component interaction)
│              (Jest + JSDOM)                 │
├─────────────────────────────────────────────┤
│              Unit Tests                     │  ← Many (pure functions)
│              (Jest/Vitest)                  │
└─────────────────────────────────────────────┘
        The Testing Pyramid
```

**Key Principles:**
1. **Test Pyramid**: Many unit tests, fewer integration tests, minimal E2E tests
2. **Self-Healing CI**: Failures must be fixed before marking tasks complete
3. **Fast Feedback**: Unit tests run < 30 seconds, full suite < 5 minutes
4. **Meaningful Coverage**: Focus on critical paths, not 100% coverage metrics

---

## Test Categories

### 1. Unit Tests (Many)

Unit tests validate individual functions in isolation. Target coverage: **80%+ for core modules**.

**What to Test:**
- Pure functions in `utils.js`, `physics.js`, `ai.js`
- State calculations (ELO, scores, positions)
- Input validation logic
- Configuration processing

**Example Unit Tests:**

```javascript
// tests/unit/utils.test.js
import { Utils } from '../../js/utils.js';

describe('Utils', () => {
  describe('lerp', () => {
    test('returns start value when t=0', () => {
      expect(Utils.lerp(0, 100, 0)).toBe(0);
    });

    test('returns end value when t=1', () => {
      expect(Utils.lerp(0, 100, 1)).toBe(100);
    });

    test('returns midpoint when t=0.5', () => {
      expect(Utils.lerp(0, 100, 0.5)).toBe(50);
    });
  });

  describe('clamp', () => {
    test('clamps value below minimum', () => {
      expect(Utils.clamp(-10, 0, 100)).toBe(0);
    });

    test('clamps value above maximum', () => {
      expect(Utils.clamp(150, 0, 100)).toBe(100);
    });

    test('returns value within range', () => {
      expect(Utils.clamp(50, 0, 100)).toBe(50);
    });
  });

  describe('randomRange', () => {
    test('returns value within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = Utils.randomRange(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThan(20);
      }
    });
  });
});

// tests/unit/physics.test.js
import { Physics } from '../../js/physics.js';

describe('Physics', () => {
  describe('checkPaddleCollision', () => {
    const paddle = { x: 10, y: 50, width: 10, height: 60 };

    test('detects collision when ball hits paddle', () => {
      const ball = { x: 20, y: 80, radius: 5, vx: -5, vy: 0 };
      expect(Physics.checkPaddleCollision(ball, paddle)).toBe(true);
    });

    test('no collision when ball misses paddle', () => {
      const ball = { x: 20, y: 200, radius: 5, vx: -5, vy: 0 };
      expect(Physics.checkPaddleCollision(ball, paddle)).toBe(false);
    });
  });

  describe('calculateBounceAngle', () => {
    test('returns angle based on hit position', () => {
      const ball = { x: 20, y: 80 };
      const paddle = { y: 50, height: 60 };
      const angle = Physics.calculateBounceAngle(ball, paddle);
      expect(angle).toBeGreaterThan(-Math.PI / 4);
      expect(angle).toBeLessThan(Math.PI / 4);
    });
  });
});

// tests/unit/ai.test.js
import { AI } from '../../js/ai.js';

describe('AI', () => {
  describe('constructor', () => {
    test('sets reaction delay based on difficulty', () => {
      const easyAI = new AI('easy');
      const hardAI = new AI('hard');
      expect(easyAI.reactionDelay).toBeGreaterThan(hardAI.reactionDelay);
    });
  });

  describe('calculateTargetY', () => {
    test('tracks ball position with error margin for easy', () => {
      const ai = new AI('easy');
      const ball = { x: 500, y: 200, vx: 5, vy: 0 };
      const targetY = ai.calculateTargetY(ball);
      // Easy AI should have some error margin
      expect(targetY).toBeCloseTo(200, -1); // Within 10 pixels
    });
  });
});
```

---

### 2. Integration Tests (Some)

Integration tests validate component interactions. Target: **Key user flows**.

**What to Test:**
- Game state transitions (menu → playing → paused → game over)
- Controls + Physics interaction
- Audio triggers on game events
- Storage persistence

**Example Integration Tests:**

```javascript
// tests/integration/game-state.test.js
import { Game } from '../../js/game.js';

describe('Game State Transitions', () => {
  let game;

  beforeEach(() => {
    // Mock canvas
    document.body.innerHTML = '<canvas id="game-canvas"></canvas>';
    game = new Game();
  });

  test('starts in menu state', () => {
    expect(game.state).toBe('menu');
  });

  test('transitions to playing when game starts', () => {
    game.start('single', { difficulty: 'easy' });
    expect(game.state).toBe('playing');
    expect(game.mode).toBe('single');
  });

  test('transitions to paused when pause called', () => {
    game.start('single', { difficulty: 'easy' });
    game.pause();
    expect(game.state).toBe('paused');
  });

  test('transitions to gameover when score limit reached', () => {
    game.start('single', { difficulty: 'easy' });
    game.scores = [11, 5]; // Player wins
    game.checkWinCondition();
    expect(game.state).toBe('gameover');
  });
});

// tests/integration/controls-physics.test.js
describe('Controls + Physics Integration', () => {
  test('paddle moves when key pressed', () => {
    const controls = new Controls(document.createElement('canvas'));
    const paddle = { y: 100, speed: 8 };
    
    // Simulate key press
    controls.keys['ArrowUp'] = true;
    const input = controls.getPlayer1Input();
    
    expect(input.direction).toBe(-1);
    paddle.y += input.direction * paddle.speed;
    expect(paddle.y).toBe(92);
  });
});

// tests/integration/storage.test.js
describe('Storage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('persists and retrieves player stats', () => {
    const stats = {
      gamesPlayed: 10,
      gamesWon: 7,
      highScore: 11
    };
    
    Storage.saveLocalStats(stats);
    const retrieved = Storage.getLocalStats();
    
    expect(retrieved).toEqual(stats);
  });

  test('persists and retrieves settings', () => {
    const settings = {
      soundEnabled: true,
      musicVolume: 0.5,
      difficulty: 'hard'
    };
    
    Storage.saveSettings(settings);
    const retrieved = Storage.getSettings();
    
    expect(retrieved).toEqual(settings);
  });
});
```

---

### 3. End-to-End Tests (Few)

E2E tests validate critical user journeys. Target: **3-5 critical paths**.

**What to Test:**
- Complete single-player game flow
- Menu navigation
- Settings persistence across sessions
- PWA installation and offline mode

**Example E2E Tests:**

```javascript
// tests/e2e/single-player.spec.js
import { test, expect } from '@playwright/test';

test.describe('Single Player Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can start and complete a game', async ({ page }) => {
    // Click play button
    await page.click('[data-testid="play-button"]');
    
    // Select single player
    await page.click('[data-testid="single-player"]');
    
    // Select difficulty
    await page.click('[data-testid="difficulty-easy"]');
    
    // Verify game started
    await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toBeVisible();
  });

  test('can pause and resume game', async ({ page }) => {
    await page.click('[data-testid="play-button"]');
    await page.click('[data-testid="single-player"]');
    await page.click('[data-testid="difficulty-easy"]');
    
    // Pause game
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="pause-menu"]')).toBeVisible();
    
    // Resume game
    await page.click('[data-testid="resume-button"]');
    await expect(page.locator('[data-testid="pause-menu"]')).not.toBeVisible();
  });
});

// tests/e2e/menu-navigation.spec.js
test.describe('Menu Navigation', () => {
  test('can navigate through all menu screens', async ({ page }) => {
    await page.goto('/');
    
    // Main menu visible
    await expect(page.locator('[data-testid="main-menu"]')).toBeVisible();
    
    // Go to settings
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('[data-testid="settings-screen"]')).toBeVisible();
    
    // Go back
    await page.click('[data-testid="back-button"]');
    await expect(page.locator('[data-testid="main-menu"]')).toBeVisible();
    
    // Go to leaderboard
    await page.click('[data-testid="leaderboard-button"]');
    await expect(page.locator('[data-testid="leaderboard-screen"]')).toBeVisible();
  });
});

// tests/e2e/pwa.spec.js
test.describe('PWA Functionality', () => {
  test('service worker registers successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker to register
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });

  test('manifest is valid', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    const manifest = await response.json();
    
    expect(manifest.name).toBe('PONG - Retro Arcade');
    expect(manifest.short_name).toBe('PONG');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
```

---

## Backend Tests

### Unit Tests for Server Logic

```javascript
// tests/unit/server/elo.test.js
const { calculateElo } = require('../../server/utils');

describe('ELO Calculation', () => {
  test('winner gains points, loser loses same amount', () => {
    const { winnerGain, loserLoss } = calculateElo(1200, 1200);
    expect(winnerGain).toBe(loserLoss);
  });

  test('underdog wins more points against higher rated', () => {
    const upsetResult = calculateElo(1000, 1400);
    const normalResult = calculateElo(1400, 1000);
    expect(upsetResult.winnerGain).toBeGreaterThan(normalResult.winnerGain);
  });

  test('rating never goes below minimum', () => {
    const { loserLoss } = calculateElo(1500, 100);
    expect(100 - loserLoss).toBeGreaterThanOrEqual(0);
  });
});

// tests/unit/server/validation.test.js
describe('Input Validation', () => {
  describe('username validation', () => {
    test('rejects empty username', () => {
      expect(validateUsername('')).toEqual({ valid: false, error: 'Username is required' });
    });

    test('rejects username too short', () => {
      expect(validateUsername('ab')).toEqual({ valid: false, error: 'Username must be 3-20 characters' });
    });

    test('rejects username too long', () => {
      expect(validateUsername('a'.repeat(21))).toEqual({ valid: false, error: 'Username must be 3-20 characters' });
    });

    test('rejects special characters', () => {
      expect(validateUsername('user@name')).toEqual({ valid: false, error: 'Invalid characters' });
    });

    test('accepts valid username', () => {
      expect(validateUsername('Player_123')).toEqual({ valid: true });
    });
  });

  describe('room code validation', () => {
    test('generates 6 character uppercase code', () => {
      const code = generateRoomCode();
      expect(code.length).toBe(6);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });
  });
});
```

### Integration Tests for Socket Events

```javascript
// tests/integration/socket.test.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('Socket.io Events', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('register creates new player', (done) => {
    clientSocket.emit('register', { username: 'TestPlayer' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.player.username).toBe('TestPlayer');
      done();
    });
  });

  test('create-room returns room code', (done) => {
    clientSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
      expect(response.success).toBe(true);
      expect(response.roomCode).toMatch(/^[A-Z0-9]{6}$/);
      done();
    });
  });

  test('join-room with invalid code fails', (done) => {
    clientSocket.emit('join-room', 'INVALID', (response) => {
      expect(response.success).toBe(false);
      expect(response.error).toBe('Room not found');
      done();
    });
  });
});
```

---

## Test Configuration

### Jest Configuration (Frontend)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/config.js',
    '!js/multiplayer.js',  // Requires network
    '!js/leaderboard.js'   // Requires Supabase
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  }
};
```

### Jest Configuration (Backend)

```javascript
// server/jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!jest.config.js',
    '!tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Playwright Configuration (E2E)

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npx serve -s . -p 8080',
    port: 8080,
    reuseExistingServer: !process.env.CI
  }
});
```

---

## Package.json Test Scripts

### Frontend package.json

```json
{
  "name": "pong-game",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint js/**/*.js",
    "lint:fix": "eslint js/**/*.js --fix",
    "serve": "npx serve -s . -p 8080"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "identity-obj-proxy": "^3.0.0"
  }
}
```

### Server package.json (updated)

```json
{
  "name": "pong-multiplayer-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint **/*.js",
    "lint:fix": "eslint **/*.js --fix"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "eslint": "^8.55.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "socket.io-client": "^4.7.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }]
  },
  globals: {
    io: 'readonly',      // Socket.io client
    supabase: 'readonly' // Supabase client
  }
};
```

---

## Test Directory Structure

```
pong-game/
├── tests/
│   ├── setup.js              # Test environment setup
│   ├── unit/
│   │   ├── utils.test.js
│   │   ├── physics.test.js
│   │   ├── ai.test.js
│   │   ├── controls.test.js
│   │   ├── powerups.test.js
│   │   └── storage.test.js
│   ├── integration/
│   │   ├── game-state.test.js
│   │   ├── controls-physics.test.js
│   │   └── storage.test.js
│   └── e2e/
│       ├── single-player.spec.js
│       ├── menu-navigation.spec.js
│       └── pwa.spec.js
├── server/
│   └── tests/
│       ├── unit/
│       │   ├── elo.test.js
│       │   └── validation.test.js
│       └── integration/
│           └── socket.test.js
├── jest.config.js
├── playwright.config.js
├── .eslintrc.js
└── package.json
```

---

## CI/CD Pipeline

See `.github/workflows/ci-tests.yml` for the automated pipeline that:

1. **Installs dependencies** for frontend and backend
2. **Lints code** to catch style/syntax issues
3. **Runs unit tests** with coverage reporting
4. **Runs integration tests**
5. **Builds the project** (validates all files load correctly)
6. **Runs E2E tests** against the built application

### Self-Healing CI

When tests fail in CI:

1. **Capture error logs** - The pipeline saves test output as artifacts
2. **Read the logs** - AI agent must review the failure output
3. **Fix the issue** - Make necessary code changes
4. **Retry** - Push changes and verify CI passes

See `.github/agents/self-healing.agent.md` for detailed agent instructions.

---

## Manual Testing Checklist

Before deployment, manually verify:

### Performance
- [ ] Game runs at 60fps on mid-range mobile device
- [ ] No memory leaks during extended play (30+ minutes)
- [ ] Animations remain smooth during power-up effects

### Mobile
- [ ] Touch controls responsive on iOS Safari
- [ ] Touch controls responsive on Android Chrome
- [ ] Portrait ↔ Landscape transition works mid-game
- [ ] No accidental zoom/scroll during gameplay

### Audio
- [ ] Sounds play after first user interaction
- [ ] Volume controls persist across sessions
- [ ] Mute toggle works correctly
- [ ] No audio glitches during rapid events

### Multiplayer (Requires Backend)
- [ ] Can create and join rooms with code
- [ ] Matchmaking finds opponents
- [ ] Paddle sync feels responsive (< 100ms latency)
- [ ] Disconnection handled gracefully

### PWA
- [ ] App installs to home screen
- [ ] Offline single-player works
- [ ] App icon displays correctly
- [ ] Launch screen shows app name

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What are the three layers of the testing pyramid (from bottom to top)?
2. What is the target code coverage for core modules?
3. What tool is used for E2E testing?
4. What must happen when CI tests fail (self-healing process)?

**Response Format:**
```
09-testing.md verified ✓
Answers: [Layers: ___, ___, ___] | [Coverage: ___% for ___] | [E2E tool: ___] | [CI failure: ___]
```
