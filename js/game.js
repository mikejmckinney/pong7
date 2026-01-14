/**
 * Main Game class for Pong
 * Orchestrates all game systems and manages game state
 */

class Game {
  constructor() {
    // Get canvas and context
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = document.getElementById('ui-overlay');

    // Game state
    this.state = 'menu'; // menu, countdown, playing, paused, gameover
    this.mode = null;    // single, local, online
    this.variant = 'classic'; // classic, chaos, speedrun
    this.difficulty = 'medium';

    // Game objects
    this.ball = null;
    this.paddle1 = null;
    this.paddle2 = null;
    this.ballTrail = [];

    // Scores
    this.scores = [0, 0];
    this.winScore = CONFIG.GAME.WIN_SCORE;
    this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;

    // Particles
    this.particles = [];

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;
    this.countdownStart = 0;
    this.countdownValue = 3;

    // Pause tracking
    this.previousState = null;

    // Multiplayer
    this.multiplayer = null;
    this.opponentPaddleY = 0;  // For online mode paddle smoothing
    this.opponentTargetY = 0;
    // Ball sync for guest players (interpolation to reduce jitter)
    this.targetBallState = null;  // { x, y, vx, vy } - target ball state from host

    // Initialize systems
    this.controls = new Controls(this.canvas);
    this.ai = new AI(this.difficulty);
    this.powerups = new PowerUpManager();
    this.powerups.setGame(this);

    // Base paddle dimensions for power-up modifications
    this.basePaddleHeight = CONFIG.GAME.PADDLE_HEIGHT;

    // Initialize screens
    Screens.init(this.overlay, this.handleMenuAction.bind(this));

    // Setup canvas resize
    this.setupResize();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Load settings
    this.loadSettings();

    // Start with menu
    this.showMainMenu();

    // Start game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Setup canvas resize handling
   */
  setupResize() {
    const resize = () => {
      const container = document.getElementById('game-container');
      const aspectRatio = CONFIG.CANVAS.ASPECT_RATIO;

      let width = container.clientWidth;
      let height = width / aspectRatio;

      if (height > container.clientHeight) {
        height = container.clientHeight;
        width = height * aspectRatio;
      }

      // Clamp to reasonable sizes
      width = Utils.clamp(width, CONFIG.CANVAS.MIN_WIDTH, CONFIG.CANVAS.MAX_WIDTH);
      height = width / aspectRatio;

      this.canvas.width = width;
      this.canvas.height = height;

      // Center canvas
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
    };

    window.addEventListener('resize', Utils.debounce(resize, 100));
    resize();
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape - pause/unpause
      if (e.key === 'Escape') {
        if (this.state === 'playing') {
          this.pause();
        } else if (this.state === 'paused') {
          this.resume();
        }
      }

      // Space - various actions
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (this.state === 'gameover') {
          this.handleMenuAction('rematch');
        }
      }
    });

    // Touch to dismiss game over
    this.canvas.addEventListener('click', () => {
      if (this.state === 'gameover') {
        this.handleMenuAction('rematch');
      }
    });
  }

  /**
   * Load settings from storage
   */
  loadSettings() {
    const settings = Storage.getSettings();
    this.difficulty = settings.difficulty || 'medium';
    this.controls.setSensitivity(settings.controlSensitivity || 1.0);
    this.controls.setInvertControls(settings.invertControls || false);

    if (settings.sfxVolume !== undefined) {
      sound.setSfxVolume(settings.sfxVolume);
    }
  }

  /**
   * Show main menu
   */
  showMainMenu() {
    this.state = 'menu';
    Screens.showMainMenu();
  }

  /**
   * Handle menu action
   * @param {string} action - Action name
   * @param {*} value - Action value
   */
  handleMenuAction(action, value) {
    switch (action) {
      case 'play':
        Screens.showModeSelect();
        break;

      case 'single':
        this.mode = 'single';
        Screens.showDifficultySelect();
        break;

      case 'local':
        this.mode = 'local';
        Screens.showVariantSelect();
        break;

      case 'online':
        this.startOnlineMode();
        break;

      case 'difficulty':
        this.difficulty = value;
        Storage.updateSetting('difficulty', value);
        this.ai.setDifficulty(value);
        Screens.showVariantSelect();
        break;

      case 'variant':
        this.variant = value;
        this.startGame(this.mode, value);
        break;

      case 'settings':
        Screens.showSettings();
        break;

      case 'leaderboard':
        Screens.showLeaderboard();
        break;

      case 'leaderboardTab':
        Screens.showLeaderboard(value);
        break;

      case 'howto':
        Screens.showHowToPlay();
        break;

      case 'back':
        if (Screens.currentScreen === 'settings' && this.state === 'paused') {
          Screens.showPauseMenu();
        } else if (Screens.currentScreen === 'variantSelect') {
          if (this.mode === 'single') {
            Screens.showDifficultySelect();
          } else {
            Screens.showModeSelect();
          }
        } else if (Screens.currentScreen === 'difficultySelect') {
          Screens.showModeSelect();
        } else if (Screens.currentScreen === 'modeSelect') {
          Screens.showMainMenu();
        } else {
          Screens.showMainMenu();
        }
        break;

      case 'resume':
        this.resume();
        break;

      case 'restart':
        this.resetGame();
        this.startGame(this.mode, this.variant);
        break;

      case 'rematch':
        this.resetGame();
        this.startGame(this.mode, this.variant);
        break;

      case 'quit':
      case 'menu':
        this.resetGame();
        if (this.multiplayer && this.multiplayer.isConnected) {
          this.multiplayer.disconnect();
        }
        this.showMainMenu();
        break;

      // Online mode actions
      case 'submitUsername':
        this.handleUsernameSubmit();
        break;

      case 'quickMatch':
        this.startQuickMatch();
        break;

      case 'createRoom':
        this.createOnlineRoom();
        break;

      case 'joinRoom':
        Screens.showJoinRoomInput();
        break;

      case 'submitRoomCode':
        this.handleJoinRoom();
        break;

      case 'onlineBack':
        if (this.multiplayer && this.multiplayer.isConnected) {
          this.multiplayer.disconnect();
        }
        Screens.showModeSelect();
        break;

      case 'cancelWaiting':
      case 'cancelMatchmaking':
        if (this.multiplayer) {
          this.multiplayer.cancelMatchmaking();
          this.multiplayer.leaveRoom();
        }
        Screens.showOnlineLobby();
        break;

      case 'requestRematch':
        if (this.multiplayer && this.multiplayer.isConnected) {
          this.multiplayer.requestRematch();
          Screens.showMatchmaking('Waiting for opponent...');
        }
        break;

      case 'acceptRematch':
        if (this.multiplayer && this.multiplayer.isConnected) {
          this.multiplayer.acceptRematch();
        }
        break;

      case 'declineRematch':
        if (this.multiplayer) {
          this.multiplayer.leaveRoom();
        }
        Screens.showOnlineLobby();
        break;
    }
  }

  /**
   * Start a new game
   * @param {string} mode - Game mode
   * @param {string} variant - Game variant (classic, chaos, speedrun)
   */
  startGame(mode, variant = 'classic') {
    this.mode = mode;
    this.variant = variant;
    this.resetGame();

    // Set win score and ball speed based on variant
    if (variant === 'chaos') {
      this.winScore = 7;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;
    } else if (variant === 'speedrun') {
      this.winScore = 5;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED * 1.5; // 50% faster ball
    } else {
      this.winScore = CONFIG.GAME.WIN_SCORE;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;
    }

    // Initialize game objects
    this.initGameObjects();

    // Hide menu overlay
    Screens.hide();

    // Start countdown
    this.startCountdown();

    // Enable touch prevention during gameplay
    enableGameplayTouchPrevention(this.canvas);

    // Start power-ups for chaos mode
    if (variant === 'chaos') {
      this.powerups.startSpawns(this.canvas);
    }

    // Play start sound
    sound.gameStart();
  }

  /**
   * Initialize game objects
   */
  initGameObjects() {
    const paddleWidth = CONFIG.GAME.PADDLE_WIDTH;
    const paddleHeight = CONFIG.GAME.PADDLE_HEIGHT;

    // Left paddle (Player 1)
    this.paddle1 = {
      x: 20,
      y: (this.canvas.height - paddleHeight) / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: CONFIG.GAME.PADDLE_SPEED
    };

    // Right paddle (Player 2 / AI)
    this.paddle2 = {
      x: this.canvas.width - 20 - paddleWidth,
      y: (this.canvas.height - paddleHeight) / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: CONFIG.GAME.PADDLE_SPEED
    };

    // Ball
    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: CONFIG.GAME.BALL_RADIUS,
      vx: 0,
      vy: 0,
      speed: this.baseBallSpeed || CONFIG.GAME.BALL_SPEED
    };

    this.ballTrail = [];
    this.particles = [];
  }

  /**
   * Start countdown before game
   */
  startCountdown() {
    this.state = 'countdown';
    this.countdownStart = performance.now();
    this.countdownValue = 3;
  }

  /**
   * Reset game state
   */
  resetGame() {
    this.scores = [0, 0];
    this.ball = null;
    this.paddle1 = null;
    this.paddle2 = null;
    this.ballTrail = [];
    this.particles = [];
    this.powerups.reset();
    this.ai.reset();
    this.controls.reset();
    this.targetBallState = null;  // Reset ball sync state for online mode

    disableGameplayTouchPrevention(this.canvas);
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.state !== 'playing') {
      return;
    }

    this.previousState = this.state;
    this.state = 'paused';
    Screens.showPauseMenu();
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.state !== 'paused') {
      return;
    }

    this.state = this.previousState || 'playing';
    this.previousState = null;
    Screens.hide();
  }

  /**
   * Handle point scored
   * @param {number} scorer - Player who scored (1 or 2)
   */
  scorePoint(scorer) {
    this.scores[scorer - 1]++;

    // Clear point-ending power-up effects (like speedBall)
    this.powerups.clearPointEffects();

    // Send score update in online mode (host only)
    if (this.mode === 'online' && this.multiplayer && this.multiplayer.isHost) {
      this.multiplayer.sendScoreUpdate(this.scores, 0);
    }

    // Play sound
    if (this.mode === 'single') {
      if (scorer === 1) {
        sound.scoreWin();
      } else {
        sound.scoreLose();
      }
    } else if (this.mode === 'online') {
      // In online mode, determine if local player scored
      const localPlayerIndex = this.multiplayer ? this.multiplayer.playerIndex : 0;
      if ((scorer === 1 && localPlayerIndex === 0) || (scorer === 2 && localPlayerIndex === 1)) {
        sound.scoreWin();
      } else {
        sound.scoreLose();
      }
    } else {
      sound.scoreWin();
    }

    // Create particles at goal
    this.createScoreParticles(scorer);

    // Check for win
    if (this.scores[scorer - 1] >= this.winScore) {
      this.gameOver(scorer);
      return;
    }

    // Reset ball after pause
    setTimeout(() => {
      if (this.state === 'playing') {
        Physics.resetBall(this.ball, this.canvas, scorer === 1 ? 1 : -1);
        // Restore variant-specific ball speed (Physics.resetBall uses default speed)
        this.ball.speed = this.baseBallSpeed;
        this.ballTrail = [];
      }
    }, CONFIG.GAME.SCORE_PAUSE_DURATION);

    // Stop ball temporarily
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  /**
   * Create particle effect for scoring
   * @param {number} scorer - Player who scored
   */
  createScoreParticles(scorer) {
    const x = scorer === 2 ? 0 : this.canvas.width;
    const y = this.ball.y;
    const color = scorer === 1 ? Renderer.colors.neonCyan : Renderer.colors.neonPink;

    for (let i = 0; i < CONFIG.VISUALS.PARTICLE_COUNT; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10 * (scorer === 2 ? 1 : -1),
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color: color
      });
    }
  }

  /**
   * Handle game over
   * @param {number} winner - Winning player (1 or 2)
   */
  gameOver(winner) {
    this.state = 'gameover';

    // Play victory sound
    sound.gameOver();

    // Update stats for single player
    if (this.mode === 'single') {
      Storage.updateStats(winner === 1, this.scores[0], this.scores[1]);
    }

    // Send game over in online mode (either player can report - server validates)
    if (this.mode === 'online' && this.multiplayer && this.multiplayer.isConnected) {
      this.multiplayer.sendGameOver(this.scores);
      // The server will send match-complete event which triggers showOnlineGameOver
      return;
    }

    // Show game over screen (for non-online modes)
    if (this.mode !== 'online') {
      Screens.showGameOver(winner, this.scores[0], this.scores[1], this.mode);
    }

    // Disable touch prevention
    disableGameplayTouchPrevention(this.canvas);
  }

  /**
   * Main game loop
   * @param {number} timestamp - Current timestamp
   */
  gameLoop(timestamp) {
    // Calculate delta time
    this.deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap delta time to prevent spiral of death
    this.deltaTime = Math.min(this.deltaTime, 0.1);

    // Update
    this.update(timestamp);

    // Render
    this.render();

    // Continue loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Update game state
   * @param {number} timestamp - Current timestamp
   */
  update(timestamp) {
    // Handle countdown
    if (this.state === 'countdown') {
      const elapsed = timestamp - this.countdownStart;
      const newCount = 3 - Math.floor(elapsed / 1000);

      if (newCount !== this.countdownValue && newCount > 0) {
        this.countdownValue = newCount;
      }

      if (elapsed >= CONFIG.GAME.COUNTDOWN_DURATION) {
        this.state = 'playing';
        Physics.resetBall(this.ball, this.canvas, null);
        // Restore variant-specific ball speed (Physics.resetBall uses default speed)
        this.ball.speed = this.baseBallSpeed;
      }
      return;
    }

    // Only update when playing
    if (this.state !== 'playing') {
      return;
    }

    // Update controls and paddles
    this.updatePaddles();

    // Update ball
    // For online guest players, interpolate ball position from host instead of running physics locally
    if (this.mode === 'online' && this.multiplayer && this.multiplayer.isGuest) {
      this.updateGuestBall();
    } else if (this.ball.vx !== 0 || this.ball.vy !== 0) {
      this.updateBall();
    }

    // Update particles
    this.updateParticles();

    // Update power-ups
    if (this.ball) {
      this.powerups.update(this.deltaTime, this.ball);
    }
  }

  /**
   * Update ball position for guest players (interpolation from host state)
   */
  updateGuestBall() {
    if (!this.targetBallState || !this.ball) return;
    
    // Use interpolation for smooth ball movement
    // This reduces jitter from network latency variations
    
    // Interpolate position (helps with visual smoothing)
    this.ball.x += (this.targetBallState.x - this.ball.x) * Game.BALL_INTERP_FACTOR;
    this.ball.y += (this.targetBallState.y - this.ball.y) * Game.BALL_INTERP_FACTOR;
    
    // Apply velocity directly (for correct ball trail direction)
    this.ball.vx = this.targetBallState.vx;
    this.ball.vy = this.targetBallState.vy;

    // Add current position to trail (same as updateBall does)
    this.ballTrail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ballTrail.length > CONFIG.VISUALS.TRAIL_LENGTH) {
      this.ballTrail.shift();
    }
  }

  /**
   * Update paddle positions based on input
   */
  updatePaddles() {
    // Apply power-up paddle size modifiers
    const p1Multiplier = this.powerups.getPaddleSizeMultiplier(1);
    const p2Multiplier = this.powerups.getPaddleSizeMultiplier(2);

    // Preserve paddle centers when height changes
    const p1CenterY = this.paddle1.y + this.paddle1.height / 2;
    const p2CenterY = this.paddle2.y + this.paddle2.height / 2;

    this.paddle1.height = this.basePaddleHeight * p1Multiplier;
    this.paddle2.height = this.basePaddleHeight * p2Multiplier;

    // Reposition paddles so their centers stay fixed and clamp to canvas bounds
    this.paddle1.y = p1CenterY - this.paddle1.height / 2;
    this.paddle2.y = p2CenterY - this.paddle2.height / 2;

    this.paddle1.y = Math.max(0, Math.min(this.paddle1.y, this.canvas.height - this.paddle1.height));
    this.paddle2.y = Math.max(0, Math.min(this.paddle2.y, this.canvas.height - this.paddle2.height));

    // Check for reversed controls
    const p1Reversed = this.powerups.isReversed(1);
    const p2Reversed = this.powerups.isReversed(2);

    // Online mode: handle based on player index
    if (this.mode === 'online' && this.multiplayer && this.multiplayer.isConnected) {
      // Determine which paddle we control based on playerIndex
      const myPaddle = this.multiplayer.isHost ? this.paddle1 : this.paddle2;
      const opponentPaddle = this.multiplayer.isHost ? this.paddle2 : this.paddle1;
      const myReversed = this.multiplayer.isHost ? p1Reversed : p2Reversed;
      
      // Get local player input (use player 1 controls for all online players)
      const myInput = this.controls.getPlayer1Input(this.mode);
      let myDirection = myInput.direction;
      if (myReversed && myDirection !== 0) {
        myDirection = -myDirection;
      }
      
      // Apply local input to our paddle
      if (myInput.y !== null) {
        const targetY = myReversed ? (this.canvas.height - myInput.y) : myInput.y;
        Physics.updatePaddle(myPaddle, targetY, this.canvas.height, myPaddle.speed);
      } else if (myDirection !== 0) {
        const targetY = myPaddle.y + myPaddle.height / 2 + (myDirection * myPaddle.speed);
        Physics.updatePaddle(myPaddle, targetY, this.canvas.height, myPaddle.speed);
      }
      
      // Send our paddle position to opponent
      const myPaddleY = myPaddle.y + myPaddle.height / 2;
      this.multiplayer.sendPaddlePosition(myPaddleY);
      
      // Smooth opponent paddle movement using configurable interpolation factor
      // This provides visual smoothing for network latency variations
      this.opponentPaddleY += (this.opponentTargetY - this.opponentPaddleY) * Game.PADDLE_SMOOTHING_FACTOR;
      
      // Update opponent paddle from network data
      Physics.updatePaddle(opponentPaddle, this.opponentPaddleY, this.canvas.height, opponentPaddle.speed);
      
      // If host, also send ball state
      if (this.multiplayer.isHost && this.ball) {
        this.multiplayer.sendBallState(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy);
      }
      
      return; // Exit early for online mode
    }

    // Player 1 input (single player and local multiplayer modes)
    const p1Input = this.controls.getPlayer1Input(this.mode);
    let p1Direction = p1Input.direction;
    if (p1Reversed && p1Direction !== 0) {
      p1Direction = -p1Direction;
    }

    if (p1Input.y !== null) {
      const targetY = p1Reversed ? (this.canvas.height - p1Input.y) : p1Input.y;
      Physics.updatePaddle(this.paddle1, targetY, this.canvas.height, this.paddle1.speed);
    } else if (p1Direction !== 0) {
      const targetY = this.paddle1.y + this.paddle1.height / 2 + (p1Direction * this.paddle1.speed);
      Physics.updatePaddle(this.paddle1, targetY, this.canvas.height, this.paddle1.speed);
    }

    // Player 2 / AI input
    if (this.mode === 'single') {
      // AI controls paddle 2 (AI is not affected by reverse power-up for fairness)
      const targetY = this.ai.update(this.ball, this.paddle2, this.canvas);
      this.ai.movePaddle(this.paddle2, targetY, this.paddle2.speed, this.canvas.height);
    } else {
      // Player 2 controls (local multiplayer)
      const p2Input = this.controls.getPlayer2Input(this.mode);
      let p2Direction = p2Input.direction;
      if (p2Reversed && p2Direction !== 0) {
        p2Direction = -p2Direction;
      }

      if (p2Input.y !== null) {
        const targetY = p2Reversed ? (this.canvas.height - p2Input.y) : p2Input.y;
        Physics.updatePaddle(this.paddle2, targetY, this.canvas.height, this.paddle2.speed);
      } else if (p2Direction !== 0) {
        const targetY = this.paddle2.y + this.paddle2.height / 2 + (p2Direction * this.paddle2.speed);
        Physics.updatePaddle(this.paddle2, targetY, this.canvas.height, this.paddle2.speed);
      }
    }
  }

  /**
   * Update ball position and check collisions
   */
  updateBall() {
    // Apply ball speed modifier from power-ups
    const speedMultiplier = this.powerups.modifiers.ballSpeedMultiplier;
    const gameSpeedMultiplier = this.powerups.modifiers.gameSpeedMultiplier;

    // Add current position to trail
    this.ballTrail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ballTrail.length > CONFIG.VISUALS.TRAIL_LENGTH) {
      this.ballTrail.shift();
    }

    // Apply curve effect if active (cap vertical velocity to prevent extreme values)
    if (this.powerups.modifiers.curveAmount !== 0) {
      this.ball.vy += this.powerups.modifiers.curveAmount;
      // Cap vertical velocity to prevent uncontrolled behavior
      const maxVy = this.ball.speed * 1.5;
      this.ball.vy = Utils.clamp(this.ball.vy, -maxVy, maxVy);
    }

    // Temporarily modify ball velocity for speed effects
    const totalMultiplier = speedMultiplier * gameSpeedMultiplier;
    this.ball.vx *= totalMultiplier;
    this.ball.vy *= totalMultiplier;

    // Update ball physics
    const result = Physics.updateBall(
      this.ball,
      this.paddle1,
      this.paddle2,
      this.canvas
    );

    // Restore velocity - only revert speed multiplication if no paddle bounce occurred.
    // If a paddle was hit, the physics engine has already set a new correct velocity.
    if (!result.hitPaddle && totalMultiplier !== 1) {
      this.ball.vx /= totalMultiplier;
      this.ball.vy /= totalMultiplier;
    }

    // Handle collisions
    if (result.hitPaddle) {
      // Check if fireball is active - ball passes through paddle once
      if (this.powerups.useFireball()) {
        // Fireball used - reverse the bounce that just happened
        // The ball should continue through the paddle
        this.ball.vx = -this.ball.vx;
        sound.wallBounce(); // Different sound for fireball pass-through
      } else {
        sound.paddleHit(result.hitPosition);
        this.createHitParticles();
      }
    }

    if (result.hitWall) {
      sound.wallBounce();
    }

    // Handle scoring - check for shield first
    if (result.scored !== null) {
      const defendingPlayer = result.scored === 1 ? 2 : 1;
      if (this.powerups.useShield(defendingPlayer)) {
        // Shield blocked the goal - bounce the ball back
        this.ball.vx = -this.ball.vx;
        this.ball.x = result.scored === 1 ? this.canvas.width - 20 : 20;
        sound.wallBounce();
      } else {
        this.scorePoint(result.scored);
      }
    }
  }

  /**
   * Create particles on paddle hit
   */
  createHitParticles() {
    const settings = Storage.getSettings();
    if (!settings.particlesEnabled) {
      return;
    }

    const color = this.ball.vx > 0 ? Renderer.colors.neonCyan : Renderer.colors.neonPink;

    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: this.ball.x,
        y: this.ball.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color: color
      });
    }
  }

  /**
   * Update particle positions and life
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render the game
   */
  render() {
    // Draw background
    Renderer.drawBackground(this.ctx, this.canvas);

    // Only draw game objects if initialized
    if (this.paddle1 && this.paddle2 && this.ball) {
      // Draw shields (behind paddles)
      this.powerups.drawShields(this.ctx, this.canvas);

      // Draw paddles
      Renderer.drawPaddle(this.ctx, this.paddle1, Renderer.colors.neonCyan);
      Renderer.drawPaddle(this.ctx, this.paddle2, Renderer.colors.neonPink);

      // Draw ball
      Renderer.drawBall(this.ctx, this.ball, this.ballTrail);

      // Draw power-ups
      this.powerups.draw(this.ctx);

      // Draw particles
      Renderer.drawParticles(this.ctx, this.particles);

      // Draw score
      Renderer.drawScore(this.ctx, this.canvas, this.scores[0], this.scores[1]);

      // Draw power-up effect indicators
      this.powerups.drawEffectIndicators(this.ctx, this.canvas);
    }

    // Draw state-specific overlays
    if (this.state === 'countdown') {
      Renderer.drawCountdown(this.ctx, this.canvas, this.countdownValue);
    }

    // Note: pause and game over overlays are handled by Screens module
  }

  /**
   * Spawn an extra ball (for multi-ball power-up)
   */
  spawnExtraBall() {
    // Note: True multi-ball would require significant refactoring to track multiple balls.
    // As a simplified implementation, this power-up makes the ball more chaotic:
    // - Increases ball speed by 20% (capped at 15)
    // - Adds random velocity perturbation for unpredictable movement
    // This simulates the chaos of having multiple balls without the complexity.
    if (this.ball) {
      this.ball.speed = Math.min(this.ball.speed * 1.2, 15);
      const direction = Math.random() < 0.5 ? 1 : -1;
      const angle = Utils.randomRange(-Math.PI / 4, Math.PI / 4);
      this.ball.vx += direction * Math.cos(angle) * 2;
      this.ball.vy += Math.sin(angle) * 2;
    }
  }

  // ==========================================
  // ONLINE MULTIPLAYER METHODS
  // ==========================================

  // Validation constants (match server-side validation)
  static USERNAME_MIN_LENGTH = 3;
  static USERNAME_MAX_LENGTH = 20;
  static USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
  static ROOM_CODE_LENGTH = 6;
  
  // Network smoothing configuration
  // Higher values = faster interpolation (more responsive but jerkier)
  // Lower values = slower interpolation (smoother but more latency)
  static PADDLE_SMOOTHING_FACTOR = 0.5; // Range: 0.1 (smooth) to 1.0 (instant)
  // Ball interpolation factor for guest players (network sync smoothing)
  // Higher values = faster tracking (more responsive but jerkier)
  // Lower values = smoother tracking (less responsive but smoother visual)
  static BALL_INTERP_FACTOR = 0.3; // Range: 0.1 (smooth) to 1.0 (instant)

  /**
   * Validate username
   * @param {string} username - Username to validate
   * @returns {{ valid: boolean, error?: string }}
   */
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length < Game.USERNAME_MIN_LENGTH || trimmed.length > Game.USERNAME_MAX_LENGTH) {
      return { valid: false, error: `Username must be ${Game.USERNAME_MIN_LENGTH}-${Game.USERNAME_MAX_LENGTH} characters` };
    }
    
    if (!Game.USERNAME_PATTERN.test(trimmed)) {
      return { valid: false, error: 'Username can only contain letters, numbers, _ and -' };
    }
    
    return { valid: true };
  }

  /**
   * Start online mode - show username input or connect
   */
  startOnlineMode() {
    this.mode = 'online';
    const username = Storage.getUsername();
    
    if (username && this.validateUsername(username).valid) {
      // Already have valid username, connect directly
      this.connectToServer();
    } else {
      // Need username first
      Screens.showUsernameInput();
    }
  }

  /**
   * Handle username submission
   */
  async handleUsernameSubmit() {
    const input = document.getElementById('username-input');
    const username = input ? input.value.trim() : '';
    
    // Validate username using shared validation
    const validation = this.validateUsername(username);
    if (!validation.valid) {
      Screens.showError(validation.error, 'back');
      return;
    }
    
    // Save username
    Storage.saveUsername(username);
    
    // Connect to server
    this.connectToServer();
  }

  /**
   * Connect to the multiplayer server
   */
  async connectToServer() {
    Screens.showConnecting();
    
    try {
      // Initialize multiplayer client if needed
      if (!this.multiplayer) {
        this.multiplayer = new MultiplayerClient();
        this.setupMultiplayerCallbacks();
      }
      
      // Connect with retry
      await this.multiplayer.connect({ maxRetries: 3 });
      
      // Register with username
      const username = Storage.getUsername();
      const registerResult = await this.multiplayer.register(username);
      
      // Check if we reconnected to an existing game
      if (registerResult.reconnected && registerResult.gameState) {
        console.log('Reconnecting to game in progress...');
        // Restore game state and continue playing
        this.handleReconnection(registerResult);
        return;
      }
      
      // Show online lobby
      Screens.showOnlineLobby();
    } catch (err) {
      console.error('Connection error:', err);
      Screens.showError('Could not connect to server. Please try again.', 'back');
    }
  }

  /**
   * Setup multiplayer event callbacks
   */
  setupMultiplayerCallbacks() {
    // Game start
    this.multiplayer.onGameStart = (data) => {
      console.log('Online game starting:', data);
      this.startOnlineGame(data);
    };
    
    // Opponent paddle movement
    this.multiplayer.onOpponentMove = (position) => {
      this.opponentTargetY = position;
    };
    
    // Ball update (guest only)
    // Store target state for interpolation to reduce jitter from network latency
    this.multiplayer.onBallUpdate = (ballState) => {
      if (this.multiplayer.isGuest && this.ball) {
        this.targetBallState = {
          x: ballState.x,
          y: ballState.y,
          vx: ballState.vx,
          vy: ballState.vy
        };
      }
    };
    
    // Score sync
    this.multiplayer.onScoreSync = (scores) => {
      this.scores = scores;
    };
    
    // Match complete
    this.multiplayer.onMatchComplete = (data) => {
      this.state = 'gameover';
      
      // Update local stats for online matches
      // Online multiplayer is 1v1, so opponent index is always the other player (0 or 1)
      const isWinner = data.winnerIndex === this.multiplayer.playerIndex;
      const myScoreIndex = this.multiplayer.playerIndex;
      const opponentScoreIndex = 1 - myScoreIndex; // 1v1 game: opponent is always the other player
      Storage.updateStats(isWinner, data.scores[myScoreIndex], data.scores[opponentScoreIndex]);
      
      Screens.showOnlineGameOver(data.winnerIndex, data.scores, this.multiplayer.playerIndex);
      disableGameplayTouchPrevention(this.canvas);
    };
    
    // Rematch requested
    this.multiplayer.onRematchRequested = () => {
      Screens.showRematchRequested();
    };
    
    // Opponent disconnected
    this.multiplayer.onOpponentDisconnect = () => {
      this.state = 'menu';
      this.resetGame();
      Screens.showOpponentDisconnected();
    };
    
    // Connection error
    this.multiplayer.onConnectionError = (err) => {
      console.error('Connection lost:', err);
      this.state = 'menu';
      this.resetGame();
      Screens.showError('Connection lost. Please reconnect.', 'menu');
    };
    
    // Player reconnected (opponent came back)
    this.multiplayer.onPlayerReconnected = (_data) => {
      console.log('Opponent reconnected to the game');
      // Resume the game if we were waiting
      if (this.state === 'paused' || this.state === 'menu') {
        // Could show a notification that opponent is back
        // For now, just continue - the game state is preserved
      }
    };
  }

  /**
   * Handle reconnection to a game in progress
   * @param {Object} data - Reconnection data from server
   */
  handleReconnection(data) {
    console.log('Handling reconnection:', data);
    
    this.mode = 'online';
    this.variant = data.gameState.gameMode || 'classic';
    
    // Don't reset game - restore state
    this.scores = data.gameState.scores || [0, 0];
    
    // Set win score based on variant
    if (this.variant === 'chaos') {
      this.winScore = 7;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;
    } else if (this.variant === 'speedrun') {
      this.winScore = 5;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED * 1.5;
    } else {
      this.winScore = CONFIG.GAME.WIN_SCORE;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;
    }
    
    // Initialize game objects
    this.initGameObjects();
    
    // Set initial opponent paddle position
    this.opponentTargetY = this.paddle2.y + this.paddle2.height / 2;
    this.opponentPaddleY = this.opponentTargetY;
    
    // Hide menu overlay
    Screens.hide();
    
    // Start playing immediately (no countdown for reconnection)
    this.state = 'playing';
    Physics.resetBall(this.ball, this.canvas, null);
    this.ball.speed = this.baseBallSpeed;
    
    // Enable touch prevention
    enableGameplayTouchPrevention(this.canvas);
    
    // Start power-ups for chaos mode
    if (this.variant === 'chaos') {
      this.powerups.startSpawns(this.canvas);
    }
    
    console.log('Game reconnected and resumed');
  }

  /**
   * Start quick match (random matchmaking)
   */
  async startQuickMatch() {
    if (!this.multiplayer || !this.multiplayer.isConnected) {
      await this.connectToServer();
      if (!this.multiplayer || !this.multiplayer.isConnected) return;
    }
    
    Screens.showMatchmaking('Searching for opponent...');
    
    try {
      const result = await this.multiplayer.findMatch('classic');
      
      if (!result.matched) {
        // Waiting in queue
        Screens.showMatchmaking('Waiting for opponent...');
      }
      // If matched, onGameStart will be called
    } catch (err) {
      console.error('Matchmaking error:', err);
      Screens.showError('Could not find match. Please try again.', 'onlineBack');
    }
  }

  /**
   * Create a private online room
   */
  async createOnlineRoom() {
    if (!this.multiplayer || !this.multiplayer.isConnected) {
      await this.connectToServer();
      if (!this.multiplayer || !this.multiplayer.isConnected) return;
    }
    
    try {
      const roomCode = await this.multiplayer.createRoom('classic');
      Screens.showWaitingForOpponent(roomCode);
    } catch (err) {
      console.error('Create room error:', err);
      Screens.showError('Could not create room. Please try again.', 'onlineBack');
    }
  }

  /**
   * Handle joining a room by code
   */
  async handleJoinRoom() {
    const input = document.getElementById('room-code-input');
    const roomCode = input ? input.value.trim().toUpperCase() : '';
    
    if (roomCode.length !== Game.ROOM_CODE_LENGTH) {
      Screens.showError(`Room code must be ${Game.ROOM_CODE_LENGTH} characters`, 'joinRoom');
      return;
    }
    
    if (!this.multiplayer || !this.multiplayer.isConnected) {
      await this.connectToServer();
      if (!this.multiplayer || !this.multiplayer.isConnected) return;
    }
    
    Screens.showConnecting();
    
    try {
      await this.multiplayer.joinRoom(roomCode);
      // onGameStart will be called when game starts
    } catch (err) {
      console.error('Join room error:', err);
      Screens.showError(err.message || 'Could not join room', 'onlineBack');
    }
  }

  /**
   * Start an online game
   * @param {Object} data - Game start data from server
   */
  startOnlineGame(data) {
    this.mode = 'online';
    this.variant = data.gameMode || 'classic';
    this.resetGame();
    
    // Set win score based on variant
    if (this.variant === 'chaos') {
      this.winScore = 7;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;
    } else if (this.variant === 'speedrun') {
      this.winScore = 5;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED * 1.5;
    } else {
      this.winScore = CONFIG.GAME.WIN_SCORE;
      this.baseBallSpeed = CONFIG.GAME.BALL_SPEED;
    }
    
    // Initialize game objects
    this.initGameObjects();
    
    // Set initial opponent paddle position
    this.opponentTargetY = this.paddle2.y + this.paddle2.height / 2;
    this.opponentPaddleY = this.opponentTargetY;
    
    // Hide menu overlay
    Screens.hide();
    
    // Start countdown
    this.startCountdown();
    
    // Enable touch prevention
    enableGameplayTouchPrevention(this.canvas);
    
    // Start power-ups for chaos mode
    if (this.variant === 'chaos') {
      this.powerups.startSpawns(this.canvas);
    }
    
    // Play start sound
    sound.gameStart();
  }
}

// Initialize game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new Game();
});
