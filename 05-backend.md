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

// CORS for REST endpoints
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:8080', 'http://127.0.0.1:8080'],
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

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
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

// Get player by username
app.get('/api/player/:username', async (req, res) => {
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

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
      // Check if player exists
      let { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('username', username)
        .single();

      if (!player) {
        // Create new player
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert({ username, display_name: username })
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
    if (room) {
      room.scores = scores;
      if (longestRally > room.longestRally) {
        room.longestRally = longestRally;
      }
      socket.to(socket.roomCode).emit('score-sync', { scores });
    }
  });

  socket.on('game-over', async ({ scores }) => {
    const room = gameRooms.get(socket.roomCode);
    if (room && room.state === 'playing') {
      room.state = 'finished';
      room.scores = scores;

      await saveMatchResult(room);

      io.to(socket.roomCode).emit('match-complete', {
        scores,
        winnerIndex: scores[0] > scores[1] ? 0 : 1,
        duration: Math.floor((Date.now() - room.startTime) / 1000)
      });
    }
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

    // Notify room and cleanup
    if (socket.roomCode) {
      const room = gameRooms.get(socket.roomCode);
      if (room) {
        socket.to(socket.roomCode).emit('opponent-disconnected');
        gameRooms.delete(socket.roomCode);
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
