/**
 * Power-ups module for Pong game
 * Handles power-up spawning, collection, and effects
 * Note: Power-ups are Phase 4 feature - stub implementation for now
 */

class PowerUpManager {
  constructor() {
    this.active = [];
    this.effects = [];
    this.spawnTimeoutId = null;
    this.spawnsActive = false;
  }

  /**
   * Start spawning power-ups
   */
  startSpawns() {
    // Power-ups not yet implemented - stub for future Phase 4
    this.spawnsActive = false;
  }

  /**
   * Stop spawning power-ups
   */
  stopSpawns() {
    if (this.spawnTimeoutId !== null) {
      clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = null;
    }
    this.spawnsActive = false;
  }

  /**
   * Spawn a new power-up
   * @param {Object} _canvas - Canvas dimensions
   */
  spawn(_canvas) {
    // Stub for Phase 4
  }

  /**
   * Update power-ups
   * @param {number} deltaTime - Time since last update
   * @param {Object} ball - Ball object
   */
  update(deltaTime, ball) {
    // Update active power-ups
    for (let i = this.active.length - 1; i >= 0; i--) {
      const powerup = this.active[i];
      // Check collision with ball
      const dist = Utils.distance(ball.x, ball.y, powerup.x, powerup.y);
      if (dist < ball.radius + (powerup.radius || 15)) {
        this.collect(powerup, ball.vx > 0 ? 1 : 2);
        this.active.splice(i, 1);
      }
    }

    // Update active effects (remove expired ones)
    const now = performance.now();
    this.effects = this.effects.filter(effect => effect.endTime > now);
  }

  /**
   * Collect a power-up
   * @param {Object} _powerup - Power-up object
   * @param {number} _player - Player who collected (1 or 2)
   */
  collect(_powerup, _player) {
    sound.powerUpCollect();
    // Apply effect - stub for Phase 4
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
   * Reset all power-ups and effects
   */
  reset() {
    this.active = [];
    this.effects = [];
    this.stopSpawns();
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
}
