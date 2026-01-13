/**
 * AI opponent module for Pong game
 * Implements different difficulty levels with varying reaction times and accuracy
 */

class AI {
  /**
   * Create an AI opponent
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard', 'impossible')
   */
  constructor(difficulty = 'medium') {
    this.setDifficulty(difficulty);
    this.targetY = null;
    this.lastUpdateTime = 0;
    this.currentMistake = 0;
  }

  /**
   * Set AI difficulty level
   * @param {string} difficulty - Difficulty level
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty.toLowerCase();
    const settings = CONFIG.AI[this.difficulty.toUpperCase()] || CONFIG.AI.MEDIUM;

    this.reactionDelay = settings.reactionDelay;
    this.mistakeChance = settings.mistakeChance;
    this.maxSpeedMultiplier = settings.maxSpeedMultiplier;
    this.predictionError = settings.predictionError;
  }

  /**
   * Update AI and get target Y position for paddle
   * @param {Object} ball - Ball object {x, y, vx, vy, radius, speed}
   * @param {Object} paddle - AI's paddle {x, y, width, height}
   * @param {Object} canvas - Canvas dimensions {width, height}
   * @returns {number} Target Y position for paddle center
   */
  update(ball, paddle, canvas) {
    const now = performance.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    // Only update target based on reaction delay
    if (timeSinceLastUpdate >= this.reactionDelay) {
      this.lastUpdateTime = now;
      this.targetY = this.calculateTargetY(ball, paddle, canvas);

      // Apply random mistake
      if (Math.random() < this.mistakeChance) {
        this.currentMistake = Utils.randomRange(-this.predictionError * 2, this.predictionError * 2);
      } else {
        this.currentMistake = 0;
      }
    }

    // If we don't have a target yet, return center
    if (this.targetY === null) {
      return canvas.height / 2;
    }

    return this.targetY + this.currentMistake;
  }

  /**
   * Calculate the optimal target Y position
   * @param {Object} ball - Ball object
   * @param {Object} paddle - AI's paddle
   * @param {Object} canvas - Canvas dimensions
   * @returns {number} Calculated target Y position
   */
  calculateTargetY(ball, paddle, canvas) {
    // If ball is stationary (during score pause) or moving away, return to center
    if (ball.vx <= 0) {
      return canvas.height / 2;
    }

    // Simple tracking for easy difficulty
    if (this.difficulty === 'easy') {
      return ball.y + Utils.randomRange(-this.predictionError, this.predictionError);
    }

    // Predict where ball will cross paddle line
    const predictedY = Physics.predictBallPosition(ball, paddle.x, canvas);

    // Add prediction error based on difficulty
    const error = Utils.randomRange(-this.predictionError, this.predictionError);

    return predictedY + error;
  }

  /**
   * Get movement speed multiplier based on difficulty
   * @returns {number} Speed multiplier (0-1)
   */
  getSpeedMultiplier() {
    return this.maxSpeedMultiplier;
  }

  /**
   * Move paddle toward target position
   * @param {Object} paddle - Paddle to move
   * @param {number} targetY - Target Y position
   * @param {number} baseSpeed - Base paddle speed
   * @param {number} canvasHeight - Height of canvas
   */
  movePaddle(paddle, targetY, baseSpeed, canvasHeight) {
    const speed = baseSpeed * this.maxSpeedMultiplier;
    Physics.updatePaddle(paddle, targetY, canvasHeight, speed);
  }

  /**
   * Reset AI state
   */
  reset() {
    this.targetY = null;
    this.lastUpdateTime = 0;
    this.currentMistake = 0;
  }
}
