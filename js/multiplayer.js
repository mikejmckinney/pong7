/**
 * Multiplayer Client
 * Handles Socket.io connection and real-time game synchronization
 */

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
   * Connect to the multiplayer backend with optional retry logic
   * @param {Object} [options] - Connection options
   * @param {number} [options.maxRetries=3] - How many times to retry after failure
   * @param {number} [options.initialDelayMs=500] - Initial backoff delay in ms
   * @param {number} [options.maxDelayMs=8000] - Maximum delay between retries
   * @param {number} [options.backoffFactor=2] - Multiplier for backoff
   * @returns {Promise<void>}
   */
  connect(options = {}) {
    const {
      maxRetries = 3,
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

        // Clean up previous socket
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        // Check if Socket.io is available
        if (typeof io === 'undefined') {
          const error = new Error('Socket.io client not loaded. Check that the Socket.io CDN script is included in index.html');
          if (this.onConnectionError) this.onConnectionError(error);
          return reject(error);
        }

        this.socket = io(CONFIG.BACKEND_URL, {
          transports: ['websocket', 'polling'],
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('Connected to server:', this.socket.id);
          this.isConnected = true;
          this._setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (err) => {
          console.error('Connection error:', err);
          this.isConnected = false;

          if (attempt <= maxRetries) {
            const delay = Math.min(currentDelay, maxDelayMs);
            console.log(`Retrying connection in ${delay}ms...`);
            currentDelay = currentDelay * backoffFactor;

            setTimeout(() => {
              attemptConnect();
            }, delay);
            return;
          }

          if (this.onConnectionError) this.onConnectionError(err);
          reject(err);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected:', reason);
          this.isConnected = false;
        });
      };

      attemptConnect();
    });
  }
  
  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.roomCode = null;
      this.playerIndex = -1;
    }
  }
  
  /**
   * Set up game event listeners
   * @private
   */
  _setupEventListeners() {
    // Game start
    this.socket.on('game-start', (data) => {
      console.log('Game starting:', data);
      if (data.roomCode) {
        this.roomCode = data.roomCode;
      }
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
  
  /**
   * Register with the server
   * @param {string} username - Player username
   * @returns {Promise<Object>} Player data
   */
  register(username) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Not connected to server'));
      }
      
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
  
  /**
   * Create a new game room
   * @param {string} [gameMode='classic'] - Game mode
   * @returns {Promise<string>} Room code
   */
  createRoom(gameMode = 'classic') {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Not connected to server'));
      }
      
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
  
  /**
   * Join an existing room by code
   * @param {string} roomCode - Room code to join
   * @returns {Promise<number>} Player index
   */
  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Not connected to server'));
      }
      
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
  
  /**
   * Find a random match
   * @param {string} [gameMode='classic'] - Game mode
   * @returns {Promise<Object>} Match result { matched, playerIndex?, position? }
   */
  findMatch(gameMode = 'classic') {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        return reject(new Error('Not connected to server'));
      }
      
      this.socket.emit('find-match', { gameMode }, (response) => {
        if (response.success) {
          if (response.matched) {
            this.playerIndex = response.playerIndex;
            this.roomCode = response.roomCode;
          }
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
  
  /**
   * Cancel matchmaking
   */
  cancelMatchmaking() {
    if (this.socket && this.isConnected) {
      this.socket.emit('cancel-matchmaking');
    }
  }
  
  // ============================
  // GAME SYNC
  // ============================
  
  /**
   * Send paddle position (call every frame)
   * @param {number} y - Paddle Y position
   */
  sendPaddlePosition(y) {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('paddle-move', { position: y });
    }
  }
  
  /**
   * Send ball state (host only, call every frame)
   * @param {number} x - Ball X position
   * @param {number} y - Ball Y position
   * @param {number} vx - Ball X velocity
   * @param {number} vy - Ball Y velocity
   */
  sendBallState(x, y, vx, vy) {
    if (this.isConnected && this.roomCode && this.playerIndex === 0) {
      this.socket.emit('ball-sync', { x, y, vx, vy });
    }
  }
  
  /**
   * Send score update
   * @param {number[]} scores - Current scores [p1, p2]
   * @param {number} [longestRally=0] - Longest rally count
   */
  sendScoreUpdate(scores, longestRally = 0) {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('score-update', { scores, longestRally });
    }
  }
  
  /**
   * Send game over signal
   * @param {number[]} scores - Final scores
   */
  sendGameOver(scores) {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('game-over', { scores });
    }
  }
  
  // ============================
  // REMATCH
  // ============================
  
  /**
   * Request a rematch
   */
  requestRematch() {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('rematch-request');
    }
  }
  
  /**
   * Accept rematch request
   */
  acceptRematch() {
    if (this.isConnected && this.roomCode) {
      this.socket.emit('rematch-accept');
    }
  }
  
  // ============================
  // HELPERS
  // ============================
  
  /**
   * Check if this player is the host
   * @returns {boolean}
   */
  get isHost() {
    return this.playerIndex === 0;
  }
  
  /**
   * Check if this player is the guest
   * @returns {boolean}
   */
  get isGuest() {
    return this.playerIndex === 1;
  }
  
  /**
   * Leave current room
   */
  leaveRoom() {
    this.roomCode = null;
    this.playerIndex = -1;
  }
}

// Export for use
window.MultiplayerClient = MultiplayerClient;
