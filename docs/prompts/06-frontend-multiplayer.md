# Frontend Multiplayer Integration

## Overview

Client-side code for connecting to the backend server and handling real-time multiplayer gameplay.

---

## Dependencies

Include Socket.io client library:

```html
<!-- In index.html (CDN approach - recommended for this vanilla JS project) -->
<!-- Socket.io client version should match the server version in package.json -->
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

**Note**: The project uses vanilla JavaScript with CDN-loaded libraries. While socket.io-client can be installed via npm for build-based projects, this isn't necessary for the GitHub Pages deployment architecture described in this documentation. Keep the CDN version in sync with the backend `socket.io` package version in `package.json`.

---

## Configuration

```javascript
// js/config.js
const CONFIG = {
  // Backend URL - different for dev vs production
  BACKEND_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://your-app.up.railway.app',
  
  // Supabase (for direct leaderboard queries)
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...'  // Public read-only key
};
```

---

## MultiplayerClient Class

```javascript
// js/multiplayer.js
class MultiplayerClient {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.playerIndex = -1;  // 0 = host (left), 1 = guest (right)
    this.isConnected = false;
    this.player = null;
    
    // Event callbacks (set by game code)
    this.onGameStart = null;
    this.onOpponentMove = null;
    this.onBallUpdate = null;
    this.onScoreSync = null;
    this.onMatchComplete = null;
    this.onRematchRequested = null;
    this.onOpponentDisconnect = null;
    this.onConnectionError = null;
  }
  
  // ============================
  // CONNECTION
  // ============================
  
  /**
   * Connect to the multiplayer backend with optional retry logic.
   *
   * @param {Object} [options]
   * @param {number} [options.maxRetries=0]        How many times to retry after the initial failure.
   * @param {number} [options.initialDelayMs=500]  Initial backoff delay in ms before the first retry.
   * @param {number} [options.maxDelayMs=8000]     Maximum delay between retries in ms.
   * @param {number} [options.backoffFactor=2]     Multiplier applied to the delay after each failed attempt.
   */
  connect(options = {}) {
    const {
      maxRetries = 0,
      initialDelayMs = 500,
      maxDelayMs = 8000,
      backoffFactor = 2
    } = options;

    let attempt = 0;
    let currentDelay = initialDelayMs;

    return new Promise((resolve, reject) => {
      const attemptConnect = () => {
        attempt += 1;

        console.log(`Connecting to server (attempt ${attempt}/${maxRetries + 1})...`);

        // Clean up previous socket if it exists
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        this.socket = io(CONFIG.BACKEND_URL, {
          transports: ['websocket', 'polling'],
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('Connected to server:', this.socket.id);
          this.isConnected = true;
          // Set up game event listeners once we have a live socket
          this._setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (err) => {
          console.error('Connection error:', err);
          this.isConnected = false;

          if (attempt <= maxRetries) {
            // Schedule a retry with exponential backoff
            const delay = Math.min(currentDelay, maxDelayMs);
            console.log(`Retrying connection in ${delay} ms...`);
            currentDelay = currentDelay * backoffFactor;

            setTimeout(() => {
              attemptConnect();
            }, delay);
            return;
          }

          // No retries left: surface the error
          if (this.onConnectionError) this.onConnectionError(err);
          reject(err);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected:', reason);
          this.isConnected = false;
        });
      };

      // Kick off the first attempt
      attemptConnect();
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.roomCode = null;
      this.playerIndex = -1;
    }
  }
  
  _setupEventListeners() {
    // Game start
    this.socket.on('game-start', (data) => {
      console.log('Game starting:', data);
      if (this.onGameStart) this.onGameStart(data);
    });
    
    // Opponent paddle movement
    this.socket.on('opponent-move', (data) => {
      if (this.onOpponentMove) this.onOpponentMove(data.position);
    });
    
    // Ball state (from host)
    this.socket.on('ball-update', (data) => {
      if (this.onBallUpdate) this.onBallUpdate(data);
    });
    
    // Score sync
    this.socket.on('score-sync', (data) => {
      if (this.onScoreSync) this.onScoreSync(data.scores);
    });
    
    // Match complete
    this.socket.on('match-complete', (data) => {
      console.log('Match complete:', data);
      if (this.onMatchComplete) this.onMatchComplete(data);
    });
    
    // Rematch requested
    this.socket.on('rematch-requested', (data) => {
      if (this.onRematchRequested) this.onRematchRequested(data);
    });
    
    // Opponent disconnected
    this.socket.on('opponent-disconnected', () => {
      console.log('Opponent disconnected');
      if (this.onOpponentDisconnect) this.onOpponentDisconnect();
    });
  }
  
  // ============================
  // REGISTRATION
  // ============================
  
  register(username) {
    return new Promise((resolve, reject) => {
      this.socket.emit('register', { username }, (response) => {
        if (response.success) {
          this.player = response.player;
          resolve(response.player);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  // ============================
  // ROOM MANAGEMENT
  // ============================
  
  createRoom(gameMode = 'classic') {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-room', { gameMode }, (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.playerIndex = 0;  // Host is player 0 (left)
          resolve(response.roomCode);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this.socket.emit('join-room', roomCode.toUpperCase(), (response) => {
        if (response.success) {
          this.roomCode = roomCode.toUpperCase();
          this.playerIndex = response.playerIndex;  // Guest is player 1 (right)
          resolve(response.playerIndex);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  // ============================
  // MATCHMAKING
  // ============================
  
  findMatch(gameMode = 'classic') {
    return new Promise((resolve, reject) => {
      this.socket.emit('find-match', { gameMode }, (response) => {
        if (response.success) {
          if (response.matched) {
            this.playerIndex = response.playerIndex;
          }
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  cancelMatchmaking() {
    this.socket.emit('cancel-matchmaking');
  }
  
  // ============================
  // GAME SYNC
  // ============================
  
  // Send paddle position (call every frame)
  sendPaddlePosition(y) {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('paddle-move', { position: y });
    }
  }
  
  // Send ball state (host only, call every frame)
  sendBallState(x, y, vx, vy) {
    if (this.isConnected && this.roomCode && this.playerIndex === 0) {
      this.socket.emit('ball-sync', { x, y, vx, vy });
    }
  }
  
  // Send score update
  sendScoreUpdate(scores, longestRally = 0) {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('score-update', { scores, longestRally });
    }
  }
  
  // Send game over
  sendGameOver(scores) {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('game-over', { scores });
    }
  }
  
  // ============================
  // REMATCH
  // ============================
  
  requestRematch() {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('rematch-request');
    }
  }
  
  acceptRematch() {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('rematch-accept');
    }
  }
  
  // ============================
  // HELPERS
  // ============================
  
  get isHost() {
    return this.playerIndex === 0;
  }
  
  get isGuest() {
    return this.playerIndex === 1;
  }
}

// Export
window.MultiplayerClient = MultiplayerClient;
```

---

## Usage Example

```javascript
// In game initialization
const multiplayer = new MultiplayerClient();

// Set up callbacks
multiplayer.onGameStart = (data) => {
  console.log('Game starting with players:', data.players);
  game.startOnlineMatch(data.players, multiplayer.playerIndex);
};

multiplayer.onOpponentMove = (position) => {
  game.setOpponentPaddlePosition(position);
};

multiplayer.onBallUpdate = (ballState) => {
  // Only update if we're the guest (host controls ball)
  if (multiplayer.isGuest) {
    game.setBallState(ballState);
  }
};

multiplayer.onScoreSync = (scores) => {
  game.setScores(scores);
};

multiplayer.onMatchComplete = (data) => {
  game.showGameOver(data.winnerIndex, data.scores, data.duration);
};

multiplayer.onOpponentDisconnect = () => {
  game.showMessage('Opponent disconnected');
  game.returnToMenu();
};

// Connect and register
async function startOnlineMode() {
  try {
    await multiplayer.connect();
    await multiplayer.register(playerUsername);
    showOnlineLobby();
  } catch (err) {
    showError('Failed to connect to server');
  }
}

// Create private room
async function createPrivateRoom() {
  const roomCode = await multiplayer.createRoom('classic');
  showRoomCode(roomCode);  // Display "Share this code: ABC123"
}

// Join room by code
async function joinRoomByCode(code) {
  try {
    await multiplayer.joinRoom(code);
    // Game will start automatically when both players are in
  } catch (err) {
    showError(err.message);  // "Room not found" or "Room is full"
  }
}

// Find random match
async function findRandomMatch() {
  showMatchmaking();  // Show "Searching for opponent..."
  const result = await multiplayer.findMatch('classic');
  
  if (!result.matched) {
    // We're in queue, wait for game-start event
    showMatchmaking('Waiting for opponent...');
  }
  // If matched, onGameStart will be called
}

// In game loop (every frame)
function gameLoop() {
  // Send our paddle position
  multiplayer.sendPaddlePosition(playerPaddle.y);
  
  // If host, send ball state
  if (multiplayer.isHost) {
    multiplayer.sendBallState(ball.x, ball.y, ball.vx, ball.vy);
  }
}

// When someone scores
function onScore(scorerIndex) {
  scores[scorerIndex]++;
  currentRally = 0;
  
  multiplayer.sendScoreUpdate(scores, longestRally);
  
  // Check for game over
  if (scores[0] >= 11 || scores[1] >= 11) {
    multiplayer.sendGameOver(scores);
  }
}
```

---

## Network Considerations

### Latency Handling

The host (player 0) is authoritative for ball position. The guest receives ball updates.

For smoother experience on the guest side:
```javascript
// Interpolate ball position
let targetBall = { x: 0, y: 0 };
let displayBall = { x: 0, y: 0 };

multiplayer.onBallUpdate = (state) => {
  targetBall = { x: state.x, y: state.y };
  // Also update velocity for prediction
  ball.vx = state.vx;
  ball.vy = state.vy;
};

// In render loop
function updateBallDisplay() {
  // Lerp toward target position
  displayBall.x += (targetBall.x - displayBall.x) * 0.3;
  displayBall.y += (targetBall.y - displayBall.y) * 0.3;
}
```

### Paddle Smoothing

Smooth opponent paddle movement:
```javascript
let opponentTargetY = 0;
let opponentDisplayY = 0;

multiplayer.onOpponentMove = (y) => {
  opponentTargetY = y;
};

// In render loop
function updateOpponentPaddle() {
  opponentDisplayY += (opponentTargetY - opponentDisplayY) * 0.5;
  opponentPaddle.y = opponentDisplayY;
}
```

### Disconnection Recovery

```javascript
multiplayer.onOpponentDisconnect = () => {
  // Pause game
  game.pause();
  
  // Show message with options
  showModal({
    title: 'Opponent Disconnected',
    message: 'Your opponent has left the game.',
    buttons: [
      { text: 'Return to Menu', action: () => game.returnToMenu() },
      { text: 'Find New Match', action: () => multiplayer.findMatch() }
    ]
  });
};
```

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What property indicates if the current player is the host?
2. Why should only the host call `sendBallState()`?
3. What interpolation technique is suggested for smooth opponent paddle movement?
4. What two transports does Socket.io use for connection?

**Response Format:**
```
06-frontend-multiplayer.md verified ✓
Answers: [Host check: ___] | [Host ball sync reason: ___] | [Smoothing technique: ___] | [Transports: ___, ___]
```
