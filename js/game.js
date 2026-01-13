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

    // Particles
    this.particles = [];

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;
    this.countdownStart = 0;
    this.countdownValue = 3;

    // Pause tracking
    this.previousState = null;

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
        // Not implemented yet
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
        this.showMainMenu();
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

    // Set win score based on variant
    if (variant === 'chaos') {
      this.winScore = 7;
    } else if (variant === 'speedrun') {
      this.winScore = 5;
    } else {
      this.winScore = CONFIG.GAME.WIN_SCORE;
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
      speed: CONFIG.GAME.BALL_SPEED
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

    // Play sound
    if (this.mode === 'single') {
      if (scorer === 1) {
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

    // Show game over screen
    Screens.showGameOver(winner, this.scores[0], this.scores[1], this.mode);

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
    if (this.ball.vx !== 0 || this.ball.vy !== 0) {
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
   * Update paddle positions based on input
   */
  updatePaddles() {
    // Apply power-up paddle size modifiers
    const p1Multiplier = this.powerups.getPaddleSizeMultiplier(1);
    const p2Multiplier = this.powerups.getPaddleSizeMultiplier(2);
    this.paddle1.height = this.basePaddleHeight * p1Multiplier;
    this.paddle2.height = this.basePaddleHeight * p2Multiplier;

    // Check for reversed controls
    const p1Reversed = this.powerups.isReversed(1);
    const p2Reversed = this.powerups.isReversed(2);

    // Player 1 input
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
      // Player 2 controls
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

    // Apply curve effect if active
    if (this.powerups.modifiers.curveAmount !== 0) {
      this.ball.vy += this.powerups.modifiers.curveAmount;
    }

    // Temporarily modify ball velocity for speed effects
    const originalVx = this.ball.vx;
    const originalVy = this.ball.vy;
    this.ball.vx *= speedMultiplier * gameSpeedMultiplier;
    this.ball.vy *= speedMultiplier * gameSpeedMultiplier;

    // Update ball physics
    const result = Physics.updateBall(
      this.ball,
      this.paddle1,
      this.paddle2,
      this.canvas
    );

    // Restore original velocities (adjusted for any bounces)
    const vxRatio = originalVx !== 0 ? this.ball.vx / (originalVx * speedMultiplier * gameSpeedMultiplier) : 1;
    const vyRatio = originalVy !== 0 ? this.ball.vy / (originalVy * speedMultiplier * gameSpeedMultiplier) : 1;
    this.ball.vx = originalVx * vxRatio;
    this.ball.vy = originalVy * vyRatio;

    // Handle collisions
    if (result.hitPaddle) {
      sound.paddleHit(result.hitPosition);
      this.createHitParticles();
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
    // Multi-ball implementation would require tracking multiple balls
    // For now, just speed up the current ball slightly
    if (this.ball) {
      this.ball.speed = Math.min(this.ball.speed * 1.2, 15);
      const direction = Math.random() < 0.5 ? 1 : -1;
      const angle = Utils.randomRange(-Math.PI / 4, Math.PI / 4);
      // Add some velocity perturbation
      this.ball.vx += direction * Math.cos(angle) * 2;
      this.ball.vy += Math.sin(angle) * 2;
    }
  }
}

// Initialize game when DOM is loaded
let game;
document.addEventListener('DOMContentLoaded', () => {
  game = new Game();
});
