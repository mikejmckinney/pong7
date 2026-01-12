# Backend Server

> **Role Context:** You are implementing the game server. Focus on low-latency communication, connection resilience, and fair matchmaking.

## Overview

Node.js server handling:
- Real-time multiplayer via Socket.io (with optional WebRTC fallback for peer-to-peer)
- Player registration and authentication
- Game room management
- Matchmaking queue
- Match result recording
- REST API for leaderboards
- Latency compensation and connection quality monitoring

### Security Considerations
- **Rate Limiting**: REST API endpoints implement rate limiting to prevent abuse (100 requests per 15 minutes per IP).
- **Input Validation**: All user inputs are validated (see registration handler for example).
- **Server-Side Authority**: Game scores and match results are validated server-side to prevent cheating.
- **RLS Policies**: Database write operations require service role, preventing direct client manipulation.
- **Authentication**: 
  - **Current Implementation**: Username-based registration without passwords (suitable for casual play).
  - **Security Trade-off**: This allows username impersonation. For production use with competitive rankings, consider implementing one of these authentication methods:
    1. **Supabase Auth**: Add email/password or OAuth (Google, GitHub) authentication via Supabase Auth.
    2. **Session Tokens**: Generate and validate secure tokens on registration, store in localStorage, validate on each connection.
    3. **Device Fingerprinting**: Use a combination of device ID + username for casual authentication.
  - **Recommendation**: For a hobby/casual game, current implementation is acceptable. For competitive play with real rankings, implement Supabase Auth before launch.

---

## Dependencies

```json
{
  "name": "pong-multiplayer-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "socket.io": "^4.7.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Environment Variables

Create `.env` file (don't commit this!):

```env
PORT=3001
FRONTEND_URL=https://yourusername.github.io/pong-game
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-key
```

---

## Server Code

```javascript
// server/index.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION
// ============================================

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase (with service key for write access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Rate limiting for REST API endpoints
// Separate limits for read (more permissive) and write operations
const readApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 min for reads (20/min)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const writeApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 min for writes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// CORS for REST endpoints
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      FRONTEND_URL, 
      'http://localhost:8080', 
      'http://127.0.0.1:8080',
      'http://[::1]:8080'  // IPv6 localhost (for https add 'https://[::1]:8080')
    ],
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ============================================
// IN-MEMORY STORAGE
// ============================================

const gameRooms = new Map();      // roomCode -> room data
const matchmakingQueue = [];      // waiting players
const playerSockets = new Map();  // socketId -> player data

// ============================================
// GAME CONSTANTS
// ============================================

const MAX_RALLY_COUNT = 10000;    // Maximum reasonable rally count (prevents abuse)
const RECONNECT_GRACE_PERIOD = 30000; // 30 seconds grace period for disconnections

// ============================================
// REST API ENDPOINTS
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'Pong server running',
    players: io.engine.clientsCount,
    rooms: gameRooms.size,
    queue: matchmakingQueue.length
  });
});

// Get leaderboard (rate limited - read only)
app.get('/api/leaderboard', readApiLimiter, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player by username (rate limited - read only)
app.get('/api/player/:username', readApiLimiter, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('username', req.params.username)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'Player not found' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a random 6-character room code.
 * Room codes are always uppercase for consistency.
 * Ensures exactly 6 characters by padding if necessary.
 * @returns {string} Uppercase alphanumeric room code (6 characters)
 */
function generateRoomCode() {
  const code = Math.random().toString(36).substring(2);
  return (code + '000000').substring(0, 6).toUpperCase();
}

function calculateElo(winnerRating, loserRating) {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  return {
    winnerGain: Math.round(K * (1 - expectedWinner)),
    loserLoss: Math.round(K * expectedWinner)
  };
}

async function saveMatchResult(room) {
  try {
    const { players, scores, gameMode, startTime, longestRally } = room;
    const [player1, player2] = players;
    const winner = scores[0] > scores[1] ? player1 : player2;
    const loser = scores[0] > scores[1] ? player2 : player1;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Insert match record
    await supabase.from('matches').insert({
      player1_id: player1.dbId,
      player2_id: player2.dbId,
      player1_score: scores[0],
      player2_score: scores[1],
      winner_id: winner.dbId,
      game_mode: gameMode || 'classic',
      duration_seconds: duration,
      longest_rally: longestRally || 0
    });

    // Get current stats
    const { data: winnerStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', winner.dbId)
      .single();

    const { data: loserStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', loser.dbId)
      .single();

    // Calculate ELO changes
    const elo = calculateElo(winnerStats.elo_rating, loserStats.elo_rating);

    // Update winner stats
    await supabase
      .from('player_stats')
      .update({
        games_played: winnerStats.games_played + 1,
        games_won: winnerStats.games_won + 1,
        total_points_scored: winnerStats.total_points_scored + (scores[0] > scores[1] ? scores[0] : scores[1]),
        total_points_conceded: winnerStats.total_points_conceded + (scores[0] > scores[1] ? scores[1] : scores[0]),
        current_win_streak: winnerStats.current_win_streak + 1,
        best_win_streak: Math.max(winnerStats.best_win_streak, winnerStats.current_win_streak + 1),
        longest_rally: Math.max(winnerStats.longest_rally, longestRally || 0),
        elo_rating: winnerStats.elo_rating + elo.winnerGain,
        updated_at: new Date().toISOString()
      })
      .eq('player_id', winner.dbId);

    // Update loser stats
    await supabase
      .from('player_stats')
      .update({
        games_played: loserStats.games_played + 1,
        games_lost: loserStats.games_lost + 1,
        total_points_scored: loserStats.total_points_scored + (scores[0] > scores[1] ? scores[1] : scores[0]),
        total_points_conceded: loserStats.total_points_conceded + (scores[0] > scores[1] ? scores[0] : scores[1]),
        current_win_streak: 0,
        longest_rally: Math.max(loserStats.longest_rally, longestRally || 0),
        elo_rating: Math.max(100, loserStats.elo_rating - elo.loserLoss),
        updated_at: new Date().toISOString()
      })
      .eq('player_id', loser.dbId);

    console.log(`Match saved: ${winner.username} beat ${loser.username}`);
  } catch (err) {
    console.error('Error saving match:', err);
  }
}

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // ------------------------------
  // REGISTRATION
  // ------------------------------
  socket.on('register', async ({ username }, callback) => {
    try {
      // Input validation
      if (!username || typeof username !== 'string') {
        return callback({ success: false, error: 'Username is required' });
      }
      
      // Sanitize and validate username (character count, not byte length)
      const sanitized = username.trim();
      const length = sanitized.length;
      
      if (length < 3 || length > 20) {
        return callback({ success: false, error: 'Username must be 3-20 characters' });
      }
      
      // Allow alphanumeric, underscores, and hyphens only
      // Prevents Unicode-based attacks, confusables, and display issues
      if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        return callback({ success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' });
      }
      
      // Check if player exists
      let { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('username', sanitized)
        .single();

      if (!player) {
        // Create new player
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert({ username: sanitized, display_name: sanitized })
          .select()
          .single();

        if (error) throw error;
        player = newPlayer;

        // Create initial stats
        await supabase
          .from('player_stats')
          .insert({ player_id: player.id });
      } else {
        // Update last seen
        await supabase
          .from('players')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', player.id);
      }

      // Store in memory
      playerSockets.set(socket.id, {
        ...player,
        dbId: player.id,
        socketId: socket.id
      });

      callback({ success: true, player });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ------------------------------
  // ROOM MANAGEMENT
  // ------------------------------
  socket.on('create-room', ({ gameMode }, callback) => {
    const roomCode = generateRoomCode();
    const player = playerSockets.get(socket.id);

    if (!player) {
      return callback({ success: false, error: 'Not registered' });
    }

    gameRooms.set(roomCode, {
      code: roomCode,
      players: [player],
      state: 'waiting',
      gameMode: gameMode || 'classic',
      scores: [0, 0],
      startTime: null,
      longestRally: 0
    });

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerIndex = 0;

    callback({ success: true, roomCode });
  });

  socket.on('join-room', (roomCode, callback) => {
    const room = gameRooms.get(roomCode.toUpperCase());
    const player = playerSockets.get(socket.id);

    if (!player) {
      return callback({ success: false, error: 'Not registered' });
    }
    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }
    if (room.players.length >= 2) {
      return callback({ success: false, error: 'Room is full' });
    }

    room.players.push(player);
    socket.join(roomCode.toUpperCase());
    socket.roomCode = roomCode.toUpperCase();
    socket.playerIndex = 1;

    // Start the game
    room.state = 'playing';
    room.startTime = Date.now();

    io.to(roomCode.toUpperCase()).emit('game-start', {
      players: room.players.map((p, i) => ({
        username: p.username,
        displayName: p.display_name,
        index: i
      })),
      gameMode: room.gameMode
    });

    callback({ success: true, playerIndex: 1 });
  });

  // ------------------------------
  // MATCHMAKING
  // ------------------------------
  socket.on('find-match', ({ gameMode }, callback) => {
    const player = playerSockets.get(socket.id);

    if (!player) {
      return callback({ success: false, error: 'Not registered' });
    }

    // Check if someone is waiting
    const opponentIndex = matchmakingQueue.findIndex(
      p => p.gameMode === (gameMode || 'classic')
    );

    if (opponentIndex !== -1) {
      // Match found!
      const opponent = matchmakingQueue.splice(opponentIndex, 1)[0];
      const roomCode = generateRoomCode();

      const room = {
        code: roomCode,
        players: [opponent.player, player],
        state: 'playing',
        gameMode: gameMode || 'classic',
        scores: [0, 0],
        startTime: Date.now(),
        longestRally: 0
      };

      gameRooms.set(roomCode, room);

      // Join both players to room
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerIndex = 1;

      const opponentSocket = io.sockets.sockets.get(opponent.player.socketId);
      if (opponentSocket) {
        opponentSocket.join(roomCode);
        opponentSocket.roomCode = roomCode;
        opponentSocket.playerIndex = 0;
      }

      // Notify both players
      io.to(roomCode).emit('game-start', {
        players: room.players.map((p, i) => ({
          username: p.username,
          displayName: p.display_name,
          index: i
        })),
        gameMode: room.gameMode
      });

      callback({ success: true, matched: true, playerIndex: 1 });
    } else {
      // Add to queue
      matchmakingQueue.push({
        player,
        gameMode: gameMode || 'classic',
        timestamp: Date.now()
      });

      callback({ success: true, matched: false, position: matchmakingQueue.length });
    }
  });

  socket.on('cancel-matchmaking', () => {
    const index = matchmakingQueue.findIndex(p => p.player.socketId === socket.id);
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
    }
  });

  // ------------------------------
  // GAME EVENTS
  // ------------------------------
  socket.on('paddle-move', ({ position }) => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('opponent-move', {
        position,
        playerIndex: socket.playerIndex
      });
    }
  });

  socket.on('ball-sync', (ballState) => {
    if (socket.roomCode && socket.playerIndex === 0) {
      socket.to(socket.roomCode).emit('ball-update', ballState);
    }
  });

  socket.on('score-update', ({ scores, longestRally }) => {
    const room = gameRooms.get(socket.roomCode);
    
    // Only process score updates for active games from the host player
    if (!room || room.state !== 'playing' || socket.playerIndex !== 0) {
      return;
    }

    const prevScores = Array.isArray(room.scores) && room.scores.length === 2
      ? room.scores
      : [0, 0];

    // Validate score format
    if (!Array.isArray(scores) || scores.length !== 2) {
      return;
    }

    const nextScores = scores.map((s) => Number.isInteger(s) && s >= 0 ? s : NaN);
    if (Number.isNaN(nextScores[0]) || Number.isNaN(nextScores[1])) {
      return;
    }

    // Prevent arbitrary score jumps: in pong, only one player scores per rally
    // Exactly one score should increase by 1, the other should remain unchanged
    const delta0 = nextScores[0] - prevScores[0];
    const delta1 = nextScores[1] - prevScores[1];
    const validDelta = (delta0 === 1 && delta1 === 0) || (delta0 === 0 && delta1 === 1);

    if (!validDelta) {
      console.warn(`Invalid score update from ${socket.id}: ${prevScores} -> ${nextScores}`);
      return;
    }

    room.scores = nextScores;

    // Validate longest rally (non-decreasing, reasonable value)
    if (typeof longestRally === 'number') {
      const clampedRally = Math.max(0, Math.floor(longestRally));
      if (clampedRally >= room.longestRally && clampedRally <= MAX_RALLY_COUNT) {
        room.longestRally = clampedRally;
      }
    }

    socket.to(socket.roomCode).emit('score-sync', { scores: room.scores });
  });

  socket.on('game-over', async ({ scores }) => {
    const room = gameRooms.get(socket.roomCode);
    
    // Prevent race condition: only process if game is still in 'playing' state
    if (!room || room.state !== 'playing') {
      return;
    }
    
    // Atomically transition to 'finished' state
    room.state = 'finished';

    // Use server-tracked scores as authoritative, not client-provided
    const finalScores = Array.isArray(room.scores) && room.scores.length === 2
      ? room.scores
      : [0, 0];

    // Optional: log discrepancies for monitoring
    if (JSON.stringify(scores) !== JSON.stringify(finalScores)) {
      console.warn(`Score mismatch from ${socket.id}: client=${JSON.stringify(scores)} server=${JSON.stringify(finalScores)}`);
    }

    await saveMatchResult(room);

    io.to(socket.roomCode).emit('match-complete', {
      scores: finalScores,
      winnerIndex: finalScores[0] > finalScores[1] ? 0 : 1,
      duration: Math.floor((Date.now() - room.startTime) / 1000)
    });
  });

  // ------------------------------
  // REMATCH
  // ------------------------------
  socket.on('rematch-request', () => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('rematch-requested', {
        fromPlayer: socket.playerIndex
      });
    }
  });

  socket.on('rematch-accept', () => {
    const room = gameRooms.get(socket.roomCode);
    if (room) {
      room.state = 'playing';
      room.scores = [0, 0];
      room.startTime = Date.now();
      room.longestRally = 0;

      io.to(socket.roomCode).emit('game-start', {
        players: room.players.map((p, i) => ({
          username: p.username,
          displayName: p.display_name,
          index: i
        })),
        gameMode: room.gameMode,
        isRematch: true
      });
    }
  });

  // ------------------------------
  // DISCONNECT
  // ------------------------------
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from matchmaking queue
    const queueIndex = matchmakingQueue.findIndex(p => p.player.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }

    // Handle room disconnection with grace period
    if (socket.roomCode) {
      const room = gameRooms.get(socket.roomCode);
      if (room) {
        // Notify opponent of disconnection
        socket.to(socket.roomCode).emit('opponent-disconnected');
        
        // Capture roomCode in closure to avoid reference issues
        const roomCode = socket.roomCode;
        
        // Set a grace period before destroying the room
        setTimeout(() => {
          // Check if room still exists and is still disconnected
          const currentRoom = gameRooms.get(roomCode);
          if (currentRoom) {
            console.log(`Grace period expired for room ${roomCode}, cleaning up`);
            gameRooms.delete(roomCode);
          }
        }, RECONNECT_GRACE_PERIOD);
      }
    }

    playerSockets.delete(socket.id);
  });
});

// ============================================
// START SERVER
// ============================================

httpServer.listen(PORT, () => {
  console.log(`🏓 Pong server running on port ${PORT}`);
  console.log(`   Frontend URL: ${FRONTEND_URL}`);
});
```

---

## Socket Events Summary

### Client → Server

| Event | Payload | Response |
|-------|---------|----------|
| `register` | `{ username }` | `{ success, player }` |
| `create-room` | `{ gameMode }` | `{ success, roomCode }` |
| `join-room` | `roomCode` | `{ success, playerIndex }` |
| `find-match` | `{ gameMode }` | `{ success, matched, playerIndex }` |
| `cancel-matchmaking` | - | - |
| `paddle-move` | `{ position }` | - |
| `ball-sync` | `{ x, y, vx, vy }` | - |
| `score-update` | `{ scores, longestRally }` | - |
| `game-over` | `{ scores }` | - |
| `rematch-request` | - | - |
| `rematch-accept` | - | - |

### Server → Client

| Event | Payload | When |
|-------|---------|------|
| `game-start` | `{ players, gameMode, isRematch }` | Room full / match found |
| `opponent-move` | `{ position, playerIndex }` | Opponent moves paddle |
| `ball-update` | `{ x, y, vx, vy }` | Ball state sync |
| `score-sync` | `{ scores }` | Score changes |
| `match-complete` | `{ scores, winnerIndex, duration }` | Game ends |
| `rematch-requested` | `{ fromPlayer }` | Opponent wants rematch |
| `opponent-disconnected` | - | Opponent leaves |

---

## Optional: Adding Authentication

The current implementation uses username-only registration, which is suitable for casual play but vulnerable to username impersonation. To add proper authentication:

### Option 1: Supabase Auth (Recommended for Production)

**Note**: Implementing authentication requires modifying the socket event signature to accept additional parameters. The current registration handler only accepts `{ username }`, but you'll need to change it to accept `{ username, authToken }`.

```javascript
// Add to backend dependencies
"dependencies": {
  "@supabase/supabase-js": "^2.39.0",
  // ... other dependencies
}

// Backend: Modify registration handler to verify authenticated user
// Change signature from ({ username }, callback) to ({ username, authToken }, callback)
socket.on('register', async ({ username, authToken }, callback) => {
  try {
    // Verify Supabase auth token
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    
    if (error || !user) {
      return callback({ success: false, error: 'Authentication required' });
    }
    
    // Input validation (as before)
    if (!username || typeof username !== 'string') {
      return callback({ success: false, error: 'Username is required' });
    }
    
    // ... rest of registration logic
    // Link player to user.id from Supabase Auth
    
  } catch (err) {
    callback({ success: false, error: err.message });
  }
});

// Frontend: Sign in before connecting
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Pass auth token to backend
await multiplayerClient.connect();
await multiplayerClient.register(username, session.access_token);
```

### Option 2: Simple Session Tokens

```javascript
// Backend: Generate token on first registration
function generateSessionToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

socket.on('register', async ({ username, sessionToken }, callback) => {
  // If sessionToken provided, validate it
  // If not, create new player and return new token
  // Store token in database linked to player
});

// Frontend: Store token in localStorage
localStorage.setItem('sessionToken', token);
```

**Note**: Implementing full authentication is beyond the scope of this basic documentation. For competitive play, use Supabase Auth before launch.

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. What four npm packages are required dependencies?
2. What is the format of a room code (length and characters)?
3. Which player (index 0 or 1) is authoritative for ball physics?
4. What Socket event does a client emit to join the matchmaking queue?

**Response Format:**
```
05-backend.md verified ✓
Answers: [Deps: ___, ___, ___, ___] | [Room code: ___ chars, ___] | [Ball authority: player ___] | [Matchmaking event: ___]
```
