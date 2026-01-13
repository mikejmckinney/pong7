/**
 * Pong Multiplayer Server
 * Handles real-time multiplayer via Socket.io, matchmaking, and game state
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { calculateEloChange, applyEloChange } = require('./lib/elo');
const { generateUniqueRoomCode } = require('./lib/roomCode');
const { 
  validateUsername, 
  validateRoomCode, 
  validateGameMode, 
  validateScores, 
  validateRally 
} = require('./lib/validation');

// ============================================
// CONFIGURATION
// ============================================

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Grace period for reconnection (30 seconds)
const RECONNECT_GRACE_PERIOD = 30000;

// Initialize Supabase if credentials provided
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Rate limiting for REST API endpoints
const readApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min for reads
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const writeApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 min for writes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS configuration
const corsOrigins = [
  FRONTEND_URL, 
  'http://localhost:8080', 
  'http://127.0.0.1:8080',
  'http://[::1]:8080'
];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
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

// Get leaderboard (rate limited)
app.get('/api/leaderboard', readApiLimiter, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
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

// Get player by username (rate limited)
app.get('/api/player/:username', readApiLimiter, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  
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
// DATABASE HELPERS
// ============================================

/**
 * Save match result to database and update player stats
 * @param {Object} room - Game room data
 */
async function saveMatchResult(room) {
  if (!supabase) {
    console.log('Database not configured, skipping match save');
    return;
  }
  
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

    if (!winnerStats || !loserStats) {
      console.error('Could not find player stats');
      return;
    }

    // Calculate ELO changes
    const elo = calculateEloChange(winnerStats.elo_rating, loserStats.elo_rating);

    // Determine winner's score and loser's score
    const winnerScore = scores[0] > scores[1] ? scores[0] : scores[1];
    const loserScore = scores[0] > scores[1] ? scores[1] : scores[0];

    // Update winner stats
    await supabase
      .from('player_stats')
      .update({
        games_played: winnerStats.games_played + 1,
        games_won: winnerStats.games_won + 1,
        total_points_scored: winnerStats.total_points_scored + winnerScore,
        total_points_conceded: winnerStats.total_points_conceded + loserScore,
        current_win_streak: winnerStats.current_win_streak + 1,
        best_win_streak: Math.max(winnerStats.best_win_streak, winnerStats.current_win_streak + 1),
        longest_rally: Math.max(winnerStats.longest_rally, longestRally || 0),
        elo_rating: applyEloChange(winnerStats.elo_rating, elo.winnerGain),
        updated_at: new Date().toISOString()
      })
      .eq('player_id', winner.dbId);

    // Update loser stats
    await supabase
      .from('player_stats')
      .update({
        games_played: loserStats.games_played + 1,
        games_lost: loserStats.games_lost + 1,
        total_points_scored: loserStats.total_points_scored + loserScore,
        total_points_conceded: loserStats.total_points_conceded + winnerScore,
        current_win_streak: 0,
        longest_rally: Math.max(loserStats.longest_rally, longestRally || 0),
        elo_rating: applyEloChange(loserStats.elo_rating, -elo.loserLoss),
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
      // Validate username
      const usernameResult = validateUsername(username);
      if (!usernameResult.valid) {
        return callback({ success: false, error: usernameResult.error });
      }
      const sanitized = usernameResult.sanitized;
      
      let player = { 
        id: socket.id, 
        username: sanitized, 
        display_name: sanitized 
      };

      // If database available, create or fetch player
      if (supabase) {
        let { data: dbPlayer } = await supabase
          .from('players')
          .select('*')
          .eq('username', sanitized)
          .single();

        if (!dbPlayer) {
          // Create new player
          const { data: newPlayer, error } = await supabase
            .from('players')
            .insert({ username: sanitized, display_name: sanitized })
            .select()
            .single();

          if (error) throw error;
          dbPlayer = newPlayer;

          // Create initial stats
          await supabase
            .from('player_stats')
            .insert({ player_id: dbPlayer.id });
        } else {
          // Update last seen
          await supabase
            .from('players')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', dbPlayer.id);
        }

        player = {
          ...dbPlayer,
          dbId: dbPlayer.id,
          socketId: socket.id
        };
      }

      // Store in memory
      playerSockets.set(socket.id, player);

      callback({ success: true, player });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // ------------------------------
  // ROOM MANAGEMENT
  // ------------------------------
  socket.on('create-room', ({ gameMode }, callback) => {
    const player = playerSockets.get(socket.id);

    if (!player) {
      return callback({ success: false, error: 'Not registered' });
    }

    // Validate game mode
    const modeResult = validateGameMode(gameMode);
    if (!modeResult.valid) {
      return callback({ success: false, error: modeResult.error });
    }

    // Generate unique room code
    const roomCode = generateUniqueRoomCode(gameRooms);
    if (!roomCode) {
      return callback({ success: false, error: 'Could not generate room code' });
    }

    gameRooms.set(roomCode, {
      code: roomCode,
      players: [player],
      state: 'waiting',
      gameMode: modeResult.mode,
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
    const player = playerSockets.get(socket.id);

    if (!player) {
      return callback({ success: false, error: 'Not registered' });
    }

    // Validate room code
    const codeResult = validateRoomCode(roomCode);
    if (!codeResult.valid) {
      return callback({ success: false, error: codeResult.error });
    }

    const room = gameRooms.get(codeResult.normalized);
    if (!room) {
      return callback({ success: false, error: 'Room not found' });
    }
    if (room.players.length >= 2) {
      return callback({ success: false, error: 'Room is full' });
    }

    room.players.push(player);
    socket.join(codeResult.normalized);
    socket.roomCode = codeResult.normalized;
    socket.playerIndex = 1;

    // Start the game
    room.state = 'playing';
    room.startTime = Date.now();

    io.to(codeResult.normalized).emit('game-start', {
      roomCode: codeResult.normalized,
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

    // Validate game mode
    const modeResult = validateGameMode(gameMode);
    if (!modeResult.valid) {
      return callback({ success: false, error: modeResult.error });
    }

    // Check if someone is waiting with same mode
    const opponentIndex = matchmakingQueue.findIndex(
      p => p.gameMode === modeResult.mode
    );

    if (opponentIndex !== -1) {
      // Match found!
      const opponent = matchmakingQueue.splice(opponentIndex, 1)[0];
      const roomCode = generateUniqueRoomCode(gameRooms);

      if (!roomCode) {
        return callback({ success: false, error: 'Could not create match' });
      }

      const room = {
        code: roomCode,
        players: [opponent.player, player],
        state: 'playing',
        gameMode: modeResult.mode,
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
        roomCode,
        players: room.players.map((p, i) => ({
          username: p.username,
          displayName: p.display_name,
          index: i
        })),
        gameMode: room.gameMode
      });

      callback({ success: true, matched: true, playerIndex: 1, roomCode });
    } else {
      // Add to queue
      matchmakingQueue.push({
        player,
        gameMode: modeResult.mode,
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
    // Only player 0 (host) can sync ball state
    if (socket.roomCode && socket.playerIndex === 0) {
      socket.to(socket.roomCode).emit('ball-update', ballState);
    }
  });

  socket.on('score-update', ({ scores, longestRally }) => {
    const room = gameRooms.get(socket.roomCode);
    
    // Only process from host player during active game
    if (!room || room.state !== 'playing' || socket.playerIndex !== 0) {
      return;
    }

    const prevScores = Array.isArray(room.scores) && room.scores.length === 2
      ? room.scores
      : [0, 0];

    // Validate scores with delta check
    const scoresResult = validateScores(scores, prevScores);
    if (!scoresResult.valid) {
      console.warn(`Invalid score update from ${socket.id}: ${scoresResult.error}`);
      return;
    }

    room.scores = scoresResult.scores;

    // Validate longest rally
    const rallyResult = validateRally(longestRally, room.longestRally);
    if (rallyResult.valid) {
      room.longestRally = rallyResult.rally;
    }

    socket.to(socket.roomCode).emit('score-sync', { scores: room.scores });
  });

  socket.on('game-over', async ({ scores }) => {
    const room = gameRooms.get(socket.roomCode);
    
    // Prevent race condition: only process if game is still 'playing'
    if (!room || room.state !== 'playing') {
      return;
    }
    
    // Atomically transition to 'finished' state
    room.state = 'finished';

    // Use server-tracked scores as authoritative
    const finalScores = Array.isArray(room.scores) && room.scores.length === 2
      ? room.scores
      : [0, 0];

    // Log discrepancies for monitoring
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
        roomCode: socket.roomCode,
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
        // Notify opponent
        socket.to(socket.roomCode).emit('opponent-disconnected');
        
        // Capture roomCode for closure
        const roomCode = socket.roomCode;
        
        // Set grace period before cleanup
        setTimeout(() => {
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

// Export for testing
module.exports = { app, httpServer, io, gameRooms, matchmakingQueue, playerSockets };

// Start server if run directly
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`🏓 Pong server running on port ${PORT}`);
    console.log(`   Frontend URL: ${FRONTEND_URL}`);
    if (supabase) {
      console.log(`   Database: Connected`);
    } else {
      console.log(`   Database: Not configured (running in memory-only mode)`);
    }
  });
}
