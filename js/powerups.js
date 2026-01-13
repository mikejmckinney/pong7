/**
 * Power-ups module for Pong game
 * Handles power-up spawning, collection, and effects
 * 
 * @description This module provides the full power-up system including:
 * - Spawning power-ups at random intervals
 * - 10 different power-up types with unique effects
 * - Visual indicators for active effects
 * - Effect duration management
 * 
 * @see docs/prompts/01-gameplay.md for power-up specifications
 */

/**
 * Power-up type definitions
 * Each power-up has a type, duration, and visual properties
 */
const POWERUP_TYPES = {
  BIG_PADDLE: {
    name: 'bigPaddle',
    duration: 10000,
    color: '#00ff88',
    description: 'Your paddle grows 50%',
    icon: '↕'
  },
  SMALL_ENEMY: {
    name: 'smallEnemy',
    duration: 10000,
    color: '#ff6600',
    description: 'Opponent paddle shrinks 30%',
    icon: '↔'
  },
  SPEED_BALL: {
    name: 'speedBall',
    duration: -1, // Until next point
    color: '#ff6600',
    description: 'Ball moves 50% faster',
    icon: '⚡'
  },
  SLOW_BALL: {
    name: 'slowBall',
    duration: 8000,
    color: '#0080ff',
    description: 'Ball moves 40% slower',
    icon: '❄'
  },
  SHIELD: {
    name: 'shield',
    duration: -1, // Single use
    color: '#00ffff',
    description: 'Blocks one goal',
    icon: '🛡'
  },
  MULTI_BALL: {
    name: 'multiBall',
    duration: -1, // Until cleared
    color: '#ff00ff',
    description: 'Spawns extra balls',
    icon: '●●'
  },
  FIREBALL: {
    name: 'fireball',
    duration: -1, // Single use
    color: '#ff4400',
    description: 'Ball passes through once',
    icon: '🔥'
  },
  REVERSE: {
    name: 'reverse',
    duration: 8000,
    color: '#bf00ff',
    description: 'Opponent controls inverted',
    icon: '⇄'
  },
  CURVE_SHOT: {
    name: 'curveShot',
    duration: 5000,
    color: '#ffff00',
    description: 'Ball curves in flight',
    icon: '〰'
  },
  SLOW_MOTION: {
    name: 'slowMotion',
    duration: 5000,
    color: '#4488ff',
    description: 'Game slows to 50%',
    icon: '⏱'
  }
};

// Array of power-up type keys for random selection
const POWERUP_TYPE_KEYS = Object.keys(POWERUP_TYPES);

class PowerUpManager {
  constructor() {
    this.active = [];
    this.effects = [];
    this.spawnTimeoutId = null;
    this.spawnsActive = false;
    this.canvas = null;
    this.gameRef = null;
    
    // Effect modifiers that can be queried by game logic
    this.modifiers = {
      paddle1SizeMultiplier: 1.0,
      paddle2SizeMultiplier: 1.0,
      ballSpeedMultiplier: 1.0,
      gameSpeedMultiplier: 1.0,
      player1Reversed: false,
      player2Reversed: false,
      player1Shield: false,
      player2Shield: false,
      fireball: false,
      curveAmount: 0
    };
  }

  /**
   * Set reference to game instance for applying effects
   * @param {Game} game - Game instance
   */
  setGame(game) {
    this.gameRef = game;
  }

  /**
   * Start spawning power-ups at random intervals
   * @param {HTMLCanvasElement} canvas - Canvas for spawn positions
   */
  startSpawns(canvas) {
    if (this.spawnsActive) {
      return;
    }
    this.canvas = canvas;
    this.spawnsActive = true;
    this.scheduleNextSpawn();
  }

  /**
   * Schedule the next power-up spawn
   */
  scheduleNextSpawn() {
    if (!this.spawnsActive) {
      return;
    }

    const interval = CONFIG.GAME.POWERUP_INTERVAL;
    const variance = CONFIG.GAME.POWERUP_VARIANCE;
    const delay = interval + (Math.random() - 0.5) * 2 * variance;

    this.spawnTimeoutId = setTimeout(() => {
      if (this.spawnsActive && this.canvas) {
        this.spawn(this.canvas);
        this.scheduleNextSpawn();
      }
    }, delay);
  }

  /**
   * Stop spawning power-ups and clear any pending spawn timers
   */
  stopSpawns() {
    if (this.spawnTimeoutId !== null) {
      clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = null;
    }
    this.spawnsActive = false;
  }

  /**
   * Spawn a new power-up at a random position
   * @param {HTMLCanvasElement} canvas - Canvas for positioning
   */
  spawn(canvas) {
    // Limit active power-ups to prevent clutter
    if (this.active.length >= 3) {
      return;
    }

    // Random type selection
    const typeKey = POWERUP_TYPE_KEYS[Utils.randomInt(0, POWERUP_TYPE_KEYS.length - 1)];
    const powerupType = POWERUP_TYPES[typeKey];

    // Random position in the middle third of the play area
    const margin = 100;
    const x = Utils.randomRange(canvas.width * 0.3, canvas.width * 0.7);
    const y = Utils.randomRange(margin, canvas.height - margin);

    const powerup = {
      x: x,
      y: y,
      radius: 15,
      type: powerupType.name,
      color: powerupType.color,
      icon: powerupType.icon,
      spawnTime: performance.now(),
      lifetime: 15000, // Power-ups disappear after 15 seconds if not collected
      pulsePhase: Math.random() * Math.PI * 2
    };

    this.active.push(powerup);
    sound.powerUpSpawn();
  }

  /**
   * Update power-ups and effects
   * @param {number} deltaTime - Time since last update (unused but kept for interface)
   * @param {Object} ball - Ball object for collision detection
   */
  update(deltaTime, ball) {
    const now = performance.now();

    // Update active power-ups (check collection and expiry)
    for (let i = this.active.length - 1; i >= 0; i--) {
      const powerup = this.active[i];

      // Check if power-up has expired
      if (now - powerup.spawnTime > powerup.lifetime) {
        this.active.splice(i, 1);
        continue;
      }

      // Check collision with ball
      const dist = Utils.distance(ball.x, ball.y, powerup.x, powerup.y);
      if (dist < ball.radius + powerup.radius) {
        // Determine which player collected based on ball direction
        const collector = ball.vx > 0 ? 1 : 2;
        this.collect(powerup, collector);
        this.active.splice(i, 1);
      }
    }

    // Update active effects (remove expired ones and update modifiers)
    this.updateEffects(now);
  }

  /**
   * Update active effects and recalculate modifiers
   * @param {number} now - Current timestamp
   */
  updateEffects(now) {
    // Reset modifiers
    this.modifiers.paddle1SizeMultiplier = 1.0;
    this.modifiers.paddle2SizeMultiplier = 1.0;
    this.modifiers.ballSpeedMultiplier = 1.0;
    this.modifiers.gameSpeedMultiplier = 1.0;
    this.modifiers.player1Reversed = false;
    this.modifiers.player2Reversed = false;
    this.modifiers.curveAmount = 0;

    // Process and filter effects
    this.effects = this.effects.filter(effect => {
      // Check if effect has expired (duration -1 means special handling)
      if (effect.duration > 0 && now >= effect.endTime) {
        return false;
      }
      return true;
    });

    // Apply active effects to modifiers
    for (const effect of this.effects) {
      switch (effect.type) {
        case 'bigPaddle':
          if (effect.player === 1) {
            this.modifiers.paddle1SizeMultiplier = 1.5;
          } else {
            this.modifiers.paddle2SizeMultiplier = 1.5;
          }
          break;

        case 'smallEnemy':
          // Affects the opponent
          if (effect.player === 1) {
            this.modifiers.paddle2SizeMultiplier = 0.7;
          } else {
            this.modifiers.paddle1SizeMultiplier = 0.7;
          }
          break;

        case 'speedBall':
          this.modifiers.ballSpeedMultiplier = 1.5;
          break;

        case 'slowBall':
          this.modifiers.ballSpeedMultiplier = 0.6;
          break;

        case 'slowMotion':
          this.modifiers.gameSpeedMultiplier = 0.5;
          break;

        case 'reverse':
          // Affects the opponent
          if (effect.player === 1) {
            this.modifiers.player2Reversed = true;
          } else {
            this.modifiers.player1Reversed = true;
          }
          break;

        case 'curveShot':
          this.modifiers.curveAmount = effect.player === 1 ? 0.1 : -0.1;
          break;
      }
    }
  }

  /**
   * Collect a power-up and apply its effect
   * @param {Object} powerup - Power-up object
   * @param {number} player - Player who collected (1 or 2)
   */
  collect(powerup, player) {
    sound.powerUpCollect();

    // Find the power-up type configuration
    const typeConfig = Object.values(POWERUP_TYPES).find(t => t.name === powerup.type);
    if (!typeConfig) {
      return;
    }

    const now = performance.now();
    const effect = {
      type: powerup.type,
      player: player,
      startTime: now,
      duration: typeConfig.duration,
      endTime: typeConfig.duration > 0 ? now + typeConfig.duration : Infinity,
      color: typeConfig.color
    };

    // Handle special power-ups that don't use the standard effect system
    switch (powerup.type) {
      case 'shield':
        if (player === 1) {
          this.modifiers.player1Shield = true;
        } else {
          this.modifiers.player2Shield = true;
        }
        this.effects.push(effect);
        break;

      case 'fireball':
        this.modifiers.fireball = true;
        this.effects.push(effect);
        break;

      case 'multiBall':
        // Multi-ball effect - spawn extra balls through game reference
        if (this.gameRef && typeof this.gameRef.spawnExtraBall === 'function') {
          this.gameRef.spawnExtraBall();
          this.gameRef.spawnExtraBall();
        }
        break;

      default:
        // Standard timed effects
        this.effects.push(effect);
        break;
    }
  }

  /**
   * Use shield (called when ball would score)
   * @param {number} player - Player whose shield to use
   * @returns {boolean} True if shield was available and used
   */
  useShield(player) {
    if (player === 1 && this.modifiers.player1Shield) {
      this.modifiers.player1Shield = false;
      // Remove shield effect
      this.effects = this.effects.filter(e => !(e.type === 'shield' && e.player === 1));
      return true;
    }
    if (player === 2 && this.modifiers.player2Shield) {
      this.modifiers.player2Shield = false;
      // Remove shield effect
      this.effects = this.effects.filter(e => !(e.type === 'shield' && e.player === 2));
      return true;
    }
    return false;
  }

  /**
   * Use fireball (called when ball hits paddle)
   * @returns {boolean} True if fireball was available and used
   */
  useFireball() {
    if (this.modifiers.fireball) {
      this.modifiers.fireball = false;
      // Remove fireball effect
      this.effects = this.effects.filter(e => e.type !== 'fireball');
      return true;
    }
    return false;
  }

  /**
   * Clear effects that end on point (like speedBall)
   */
  clearPointEffects() {
    this.effects = this.effects.filter(e => {
      // Remove effects that last "until next point"
      return e.type !== 'speedBall';
    });
    this.updateEffects(performance.now());
  }

  /**
   * Draw all active power-ups
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    for (const powerup of this.active) {
      Renderer.drawPowerUp(ctx, powerup);
    }
  }

  /**
   * Draw active effect indicators
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  drawEffectIndicators(ctx, canvas) {
    const now = performance.now();
    let y1 = 80; // Start position for player 1 effects
    let y2 = 80; // Start position for player 2 effects

    for (const effect of this.effects) {
      const typeConfig = Object.values(POWERUP_TYPES).find(t => t.name === effect.type);
      if (!typeConfig) continue;

      // Calculate remaining time
      let timeText = '';
      if (effect.duration > 0) {
        const remaining = Math.ceil((effect.endTime - now) / 1000);
        timeText = `${remaining}s`;
      }

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = typeConfig.color;
      ctx.shadowColor = typeConfig.color;
      ctx.shadowBlur = 10;

      if (effect.player === 1) {
        ctx.textAlign = 'left';
        ctx.fillText(`${typeConfig.icon} ${timeText}`, 20, y1);
        y1 += 20;
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(`${timeText} ${typeConfig.icon}`, canvas.width - 20, y2);
        y2 += 20;
      }

      ctx.shadowBlur = 0;
    }
  }

  /**
   * Draw shield indicators
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  drawShields(ctx, canvas) {
    ctx.lineWidth = 4;

    if (this.modifiers.player1Shield) {
      ctx.strokeStyle = POWERUP_TYPES.SHIELD.color;
      ctx.shadowColor = POWERUP_TYPES.SHIELD.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(5, canvas.height);
      ctx.stroke();
    }

    if (this.modifiers.player2Shield) {
      ctx.strokeStyle = POWERUP_TYPES.SHIELD.color;
      ctx.shadowColor = POWERUP_TYPES.SHIELD.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 5, 0);
      ctx.lineTo(canvas.width - 5, canvas.height);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Reset all power-ups and effects
   */
  reset() {
    this.active = [];
    this.effects = [];
    this.stopSpawns();

    // Reset all modifiers
    this.modifiers = {
      paddle1SizeMultiplier: 1.0,
      paddle2SizeMultiplier: 1.0,
      ballSpeedMultiplier: 1.0,
      gameSpeedMultiplier: 1.0,
      player1Reversed: false,
      player2Reversed: false,
      player1Shield: false,
      player2Shield: false,
      fireball: false,
      curveAmount: 0
    };
  }

  /**
   * Check if a specific effect is active for a player
   * @param {string} effectType - Type of effect
   * @param {number} player - Player number
   * @returns {boolean} True if effect is active
   */
  hasEffect(effectType, player) {
    return this.effects.some(e => e.type === effectType && e.player === player);
  }

  /**
   * Get paddle size multiplier for a player
   * @param {number} player - Player number (1 or 2)
   * @returns {number} Size multiplier
   */
  getPaddleSizeMultiplier(player) {
    return player === 1 ? this.modifiers.paddle1SizeMultiplier : this.modifiers.paddle2SizeMultiplier;
  }

  /**
   * Check if a player's controls are reversed
   * @param {number} player - Player number (1 or 2)
   * @returns {boolean} True if controls are reversed
   */
  isReversed(player) {
    return player === 1 ? this.modifiers.player1Reversed : this.modifiers.player2Reversed;
  }
}

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PowerUpManager, POWERUP_TYPES, POWERUP_TYPE_KEYS };
}
