/**
 * Integration tests for Pong Multiplayer Server
 * Tests Socket.io event handlers, room management, and matchmaking
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const request = require('supertest');

// Import server components for testing
const { app, httpServer, io, gameRooms, matchmakingQueue, playerSockets } = require('./index');

// Test configuration
const TEST_PORT = 3099;
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('Server Integration Tests', () => {
  let serverInstance;
  
  beforeAll((done) => {
    // Start the server on test port
    serverInstance = httpServer.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      done();
    });
  });

  afterAll((done) => {
    // Close all socket connections and server
    io.close();
    serverInstance.close(done);
  });

  beforeEach(() => {
    // Clear in-memory state between tests
    gameRooms.clear();
    matchmakingQueue.length = 0;
    playerSockets.clear();
  });

  // ============================================
  // REST API TESTS
  // ============================================
  
  describe('REST API Endpoints', () => {
    test('GET / returns server status', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'Pong server running');
      expect(response.body).toHaveProperty('players');
      expect(response.body).toHaveProperty('rooms');
      expect(response.body).toHaveProperty('queue');
    });

    test('GET /api/leaderboard returns 503 when database not configured', async () => {
      const response = await request(app).get('/api/leaderboard');
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'Database not configured');
    });

    test('GET /api/player/:username returns 503 when database not configured', async () => {
      const response = await request(app).get('/api/player/testuser');
      
      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'Database not configured');
    });
  });

  // ============================================
  // SOCKET.IO CONNECTION TESTS
  // ============================================
  
  describe('Socket.io Connections', () => {
    let clientSocket;

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
      done();
    });

    test('client can connect to server', (done) => {
      clientSocket = Client(TEST_URL, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', done);
    });

    test('server emits disconnect when client disconnects', (done) => {
      clientSocket = Client(TEST_URL, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        clientSocket.disconnect();
      });

      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });
    });
  });

  // ============================================
  // REGISTRATION TESTS
  // ============================================
  
  describe('Player Registration', () => {
    let clientSocket;

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
      setTimeout(done, 50); // Brief delay to ensure cleanup
    });

    test('player can register with valid username', (done) => {
      clientSocket = Client(TEST_URL, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('register', { username: 'TestPlayer1' }, (response) => {
          expect(response.success).toBe(true);
          expect(response.player).toBeDefined();
          expect(response.player.username).toBe('TestPlayer1');
          done();
        });
      });
    });

    test('registration fails with too short username', (done) => {
      clientSocket = Client(TEST_URL, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('register', { username: 'ab' }, (response) => {
          expect(response.success).toBe(false);
          expect(response.error).toContain('3-20');
          done();
        });
      });
    });

    test('registration fails with invalid characters', (done) => {
      clientSocket = Client(TEST_URL, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('register', { username: 'user@name' }, (response) => {
          expect(response.success).toBe(false);
          expect(response.error).toContain('letters, numbers');
          done();
        });
      });
    });

    test('registration trims whitespace from username', (done) => {
      clientSocket = Client(TEST_URL, {
        transports: ['websocket'],
        forceNew: true
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('register', { username: '  Player1  ' }, (response) => {
          expect(response.success).toBe(true);
          expect(response.player.username).toBe('Player1');
          done();
        });
      });
    });
  });

  // ============================================
  // ROOM MANAGEMENT TESTS
  // ============================================
  
  describe('Room Management', () => {
    let hostSocket, guestSocket;

    afterEach((done) => {
      if (hostSocket && hostSocket.connected) hostSocket.disconnect();
      if (guestSocket && guestSocket.connected) guestSocket.disconnect();
      setTimeout(done, 50);
    });

    test('registered player can create a room', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, (regResponse) => {
          expect(regResponse.success).toBe(true);

          hostSocket.emit('create-room', { gameMode: 'classic' }, (roomResponse) => {
            expect(roomResponse.success).toBe(true);
            expect(roomResponse.roomCode).toBeDefined();
            expect(roomResponse.roomCode).toHaveLength(6);
            expect(gameRooms.has(roomResponse.roomCode)).toBe(true);
            done();
          });
        });
      });
    });

    test('unregistered player cannot create a room', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
          expect(response.success).toBe(false);
          expect(response.error).toBe('Not registered');
          done();
        });
      });
    });

    test('second player can join a room and game starts', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      guestSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      let roomCode;
      let gameStartReceived = { host: false, guest: false };

      // Setup host
      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, () => {
          hostSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
            roomCode = response.roomCode;
            
            // Setup guest after room is created
            guestSocket.emit('register', { username: 'Guest' }, () => {
              guestSocket.emit('join-room', roomCode, (joinResponse) => {
                expect(joinResponse.success).toBe(true);
                expect(joinResponse.playerIndex).toBe(1);
              });
            });
          });
        });
      });

      // Both should receive game-start event
      hostSocket.on('game-start', (data) => {
        expect(data.roomCode).toBe(roomCode);
        expect(data.players).toHaveLength(2);
        expect(data.gameMode).toBe('classic');
        gameStartReceived.host = true;
        if (gameStartReceived.host && gameStartReceived.guest) done();
      });

      guestSocket.on('game-start', (data) => {
        expect(data.roomCode).toBe(roomCode);
        expect(data.players).toHaveLength(2);
        gameStartReceived.guest = true;
        if (gameStartReceived.host && gameStartReceived.guest) done();
      });
    });

    test('cannot join non-existent room', (done) => {
      guestSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      guestSocket.on('connect', () => {
        guestSocket.emit('register', { username: 'Guest' }, () => {
          guestSocket.emit('join-room', 'XXXXXX', (response) => {
            expect(response.success).toBe(false);
            expect(response.error).toBe('Room not found');
            done();
          });
        });
      });
    });

    test('cannot join full room', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      guestSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      const thirdSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, () => {
          hostSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
            const roomCode = response.roomCode;
            
            guestSocket.emit('register', { username: 'Guest1' }, () => {
              guestSocket.emit('join-room', roomCode, () => {
                // Third player tries to join
                thirdSocket.emit('register', { username: 'Guest2' }, () => {
                  thirdSocket.emit('join-room', roomCode, (joinResponse) => {
                    expect(joinResponse.success).toBe(false);
                    expect(joinResponse.error).toBe('Room is full');
                    thirdSocket.disconnect();
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  // ============================================
  // MATCHMAKING TESTS
  // ============================================
  
  describe('Matchmaking', () => {
    let player1Socket, player2Socket;

    afterEach((done) => {
      if (player1Socket && player1Socket.connected) player1Socket.disconnect();
      if (player2Socket && player2Socket.connected) player2Socket.disconnect();
      setTimeout(done, 50);
    });

    test('player enters matchmaking queue when no opponent available', (done) => {
      player1Socket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      player1Socket.on('connect', () => {
        player1Socket.emit('register', { username: 'Player1' }, () => {
          player1Socket.emit('find-match', { gameMode: 'classic' }, (response) => {
            expect(response.success).toBe(true);
            expect(response.matched).toBe(false);
            expect(response.position).toBe(1);
            expect(matchmakingQueue).toHaveLength(1);
            done();
          });
        });
      });
    });

    test('two players get matched together', (done) => {
      player1Socket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      player2Socket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      let matchedCount = 0;

      player1Socket.on('connect', () => {
        player1Socket.emit('register', { username: 'Player1' }, () => {
          player1Socket.emit('find-match', { gameMode: 'classic' }, (response) => {
            expect(response.success).toBe(true);
            expect(response.matched).toBe(false); // First player waits
            
            // Second player joins
            player2Socket.emit('register', { username: 'Player2' }, () => {
              player2Socket.emit('find-match', { gameMode: 'classic' }, (response2) => {
                expect(response2.success).toBe(true);
                expect(response2.matched).toBe(true); // Second player gets matched
                expect(response2.playerIndex).toBe(1);
              });
            });
          });
        });
      });

      // Both should receive game-start
      player1Socket.on('game-start', () => {
        matchedCount++;
        if (matchedCount === 2) done();
      });

      player2Socket.on('game-start', () => {
        matchedCount++;
        if (matchedCount === 2) done();
      });
    });

    test('player can cancel matchmaking', (done) => {
      player1Socket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      player1Socket.on('connect', () => {
        player1Socket.emit('register', { username: 'Player1' }, () => {
          player1Socket.emit('find-match', { gameMode: 'classic' }, () => {
            expect(matchmakingQueue).toHaveLength(1);
            
            player1Socket.emit('cancel-matchmaking');
            
            // Give server time to process
            setTimeout(() => {
              expect(matchmakingQueue).toHaveLength(0);
              done();
            }, 50);
          });
        });
      });
    });
  });

  // ============================================
  // GAME EVENT TESTS
  // ============================================
  
  describe('Game Events', () => {
    let hostSocket, guestSocket;
    let roomCode;

    // Helper to set up a game with two players
    const setupGame = (callback) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      guestSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, () => {
          hostSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
            roomCode = response.roomCode;
            
            guestSocket.emit('register', { username: 'Guest' }, () => {
              guestSocket.emit('join-room', roomCode, callback);
            });
          });
        });
      });
    };

    afterEach((done) => {
      if (hostSocket && hostSocket.connected) hostSocket.disconnect();
      if (guestSocket && guestSocket.connected) guestSocket.disconnect();
      setTimeout(done, 50);
    });

    test('paddle movement is relayed to opponent', (done) => {
      setupGame(() => {
        // Guest should receive host's paddle movement
        guestSocket.on('opponent-move', (data) => {
          expect(data.position).toBe(100);
          expect(data.playerIndex).toBe(0); // From host
          done();
        });

        // Host sends paddle position
        setTimeout(() => {
          hostSocket.emit('paddle-move', { position: 100 });
        }, 50);
      });
    });

    test('ball sync is relayed from host to guest', (done) => {
      setupGame(() => {
        // Guest should receive ball update
        guestSocket.on('ball-update', (data) => {
          expect(data.x).toBe(400);
          expect(data.y).toBe(300);
          expect(data.vx).toBe(5);
          expect(data.vy).toBe(-3);
          done();
        });

        // Host sends ball state
        setTimeout(() => {
          hostSocket.emit('ball-sync', { x: 400, y: 300, vx: 5, vy: -3 });
        }, 50);
      });
    });

    test('score update is synced to guest', (done) => {
      setupGame(() => {
        // Guest should receive score sync
        guestSocket.on('score-sync', (data) => {
          expect(data.scores).toEqual([1, 0]);
          done();
        });

        // Host sends score update
        setTimeout(() => {
          hostSocket.emit('score-update', { scores: [1, 0], longestRally: 5 });
        }, 50);
      });
    });

    test('game over triggers match-complete for both players', (done) => {
      setupGame(() => {
        let completedCount = 0;
        
        const checkDone = (data) => {
          expect(data.scores).toBeDefined();
          expect(data.winnerIndex).toBeDefined();
          expect(data.duration).toBeDefined();
          completedCount++;
          if (completedCount === 2) done();
        };

        hostSocket.on('match-complete', checkDone);
        guestSocket.on('match-complete', checkDone);

        // Set up scores first, then end game
        setTimeout(() => {
          const room = gameRooms.get(roomCode);
          room.scores = [11, 5]; // Host wins
          hostSocket.emit('game-over', { scores: [11, 5] });
        }, 50);
      });
    });
  });

  // ============================================
  // REMATCH TESTS
  // ============================================
  
  describe('Rematch Flow', () => {
    let hostSocket, guestSocket;
    let roomCode;

    afterEach((done) => {
      if (hostSocket && hostSocket.connected) hostSocket.disconnect();
      if (guestSocket && guestSocket.connected) guestSocket.disconnect();
      setTimeout(done, 50);
    });

    test('rematch request and accept restarts the game', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      guestSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, () => {
          hostSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
            roomCode = response.roomCode;
            
            guestSocket.emit('register', { username: 'Guest' }, () => {
              guestSocket.emit('join-room', roomCode, () => {
                // Wait for game to start, then simulate game over
                setTimeout(() => {
                  const room = gameRooms.get(roomCode);
                  room.scores = [11, 5];
                  room.state = 'finished';
                  
                  // Host requests rematch
                  hostSocket.emit('rematch-request');
                }, 50);
              });
            });
          });
        });
      });

      // Guest receives rematch request
      guestSocket.on('rematch-requested', (data) => {
        expect(data.fromPlayer).toBe(0);
        guestSocket.emit('rematch-accept');
      });

      // Track game-start count (should be 2: initial + rematch)
      let gameStartCount = 0;
      hostSocket.on('game-start', (data) => {
        gameStartCount++;
        if (gameStartCount === 2) {
          expect(data.isRematch).toBe(true);
          const room = gameRooms.get(roomCode);
          expect(room.scores).toEqual([0, 0]); // Scores reset
          expect(room.state).toBe('playing');
          done();
        }
      });
    });
  });

  // ============================================
  // DISCONNECT HANDLING TESTS
  // ============================================
  
  describe('Disconnect Handling', () => {
    let hostSocket, guestSocket;

    afterEach((done) => {
      if (hostSocket && hostSocket.connected) hostSocket.disconnect();
      if (guestSocket && guestSocket.connected) guestSocket.disconnect();
      setTimeout(done, 50);
    });

    test('opponent receives notification when player disconnects', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });
      guestSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, () => {
          hostSocket.emit('create-room', { gameMode: 'classic' }, (response) => {
            const roomCode = response.roomCode;
            
            guestSocket.emit('register', { username: 'Guest' }, () => {
              guestSocket.emit('join-room', roomCode, () => {
                // Wait for game to start, then host disconnects
                setTimeout(() => {
                  hostSocket.disconnect();
                }, 50);
              });
            });
          });
        });
      });

      guestSocket.on('opponent-disconnected', () => {
        // Guest should be notified
        done();
      });
    });

    test('player is removed from matchmaking queue on disconnect', (done) => {
      hostSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      hostSocket.on('connect', () => {
        hostSocket.emit('register', { username: 'Host' }, () => {
          hostSocket.emit('find-match', { gameMode: 'classic' }, () => {
            expect(matchmakingQueue).toHaveLength(1);
            
            hostSocket.disconnect();
            
            // Give server time to process
            setTimeout(() => {
              expect(matchmakingQueue).toHaveLength(0);
              done();
            }, 100);
          });
        });
      });
    });
  });

  // ============================================
  // RATE LIMITING TESTS
  // ============================================
  
  describe('Rate Limiting', () => {
    let clientSocket;

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) clientSocket.disconnect();
      setTimeout(done, 50);
    });

    test('excessive registration attempts are rate limited', (done) => {
      clientSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      clientSocket.on('connect', () => {
        let rateLimitedCount = 0;
        let successCount = 0;
        
        // Try 5 registrations quickly (limit is 3 per 10s)
        for (let i = 0; i < 5; i++) {
          clientSocket.emit('register', { username: `User${i}` }, (response) => {
            if (response.success) {
              successCount++;
            } else if (response.error.includes('Too many')) {
              rateLimitedCount++;
            }
            
            if (successCount + rateLimitedCount === 5) {
              expect(rateLimitedCount).toBeGreaterThan(0);
              done();
            }
          });
        }
      });
    });
  });

  // ============================================
  // VALIDATION EDGE CASES
  // ============================================
  
  describe('Validation Edge Cases', () => {
    let clientSocket;

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) clientSocket.disconnect();
      setTimeout(done, 50);
    });

    test('invalid game mode is rejected', (done) => {
      clientSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      clientSocket.on('connect', () => {
        clientSocket.emit('register', { username: 'TestPlayer' }, () => {
          clientSocket.emit('create-room', { gameMode: 'invalid-mode' }, (response) => {
            expect(response.success).toBe(false);
            expect(response.error).toBe('Invalid game mode');
            done();
          });
        });
      });
    });

    test('invalid room code format is rejected', (done) => {
      clientSocket = Client(TEST_URL, { transports: ['websocket'], forceNew: true });

      clientSocket.on('connect', () => {
        clientSocket.emit('register', { username: 'TestPlayer' }, () => {
          clientSocket.emit('join-room', 'ABC', (response) => {
            expect(response.success).toBe(false);
            expect(response.error).toContain('6 characters');
            done();
          });
        });
      });
    });
  });
});
