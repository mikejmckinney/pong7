/**
 * Physics module for Pong game
 * Handles ball movement, collision detection, and bounce calculations
 */

const Physics = {
  /**
   * Update ball position and handle collisions
   * @param {Object} ball - Ball object {x, y, vx, vy, radius, speed}
   * @param {Object} paddle1 - Left paddle {x, y, width, height}
   * @param {Object} paddle2 - Right paddle {x, y, width, height}
   * @param {Object} canvas - Canvas dimensions {width, height}
   * @returns {Object} Result with collision info {scored: null|1|2, hitPaddle: boolean, hitWall: boolean}
   */
  updateBall(ball, paddle1, paddle2, canvas) {
    const result = {
      scored: null,
      hitPaddle: false,
      hitWall: false,
      hitPosition: 0
    };

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Check wall collisions (top and bottom)
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      result.hitWall = true;
    } else if (ball.y + ball.radius >= canvas.height) {
      ball.y = canvas.height - ball.radius;
      ball.vy = -Math.abs(ball.vy);
      result.hitWall = true;
    }

    // Check paddle collisions
    // Left paddle (paddle1)
    if (this.checkPaddleCollision(ball, paddle1)) {
      ball.x = paddle1.x + paddle1.width + ball.radius;
      const hitPos = this.calculateHitPosition(ball, paddle1);
      result.hitPosition = hitPos;
      this.applyBounce(ball, paddle1, 1);
      result.hitPaddle = true;
    }

    // Right paddle (paddle2)
    if (this.checkPaddleCollision(ball, paddle2)) {
      ball.x = paddle2.x - ball.radius;
      const hitPos = this.calculateHitPosition(ball, paddle2);
      result.hitPosition = hitPos;
      this.applyBounce(ball, paddle2, -1);
      result.hitPaddle = true;
    }

    // Check scoring (ball passes paddles)
    if (ball.x - ball.radius <= 0) {
      result.scored = 2; // Player 2 scores
    } else if (ball.x + ball.radius >= canvas.width) {
      result.scored = 1; // Player 1 scores
    }

    return result;
  },

  /**
   * Check if ball collides with paddle
   * @param {Object} ball - Ball object
   * @param {Object} paddle - Paddle object
   * @returns {boolean} True if collision detected
   */
  checkPaddleCollision(ball, paddle) {
    // Check if ball is within paddle's X range
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;

    // Check if ball is within paddle's Y range
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;

    // Check for overlap
    const xOverlap = ballRight >= paddleLeft && ballLeft <= paddleRight;
    const yOverlap = ballBottom >= paddleTop && ballTop <= paddleBottom;

    // Also check ball is moving toward paddle
    const movingTowardPaddle =
      (paddle.x < ball.x && ball.vx < 0) ||
      (paddle.x > ball.x && ball.vx > 0);

    return xOverlap && yOverlap && movingTowardPaddle;
  },

  /**
   * Calculate where on the paddle the ball hit (-1 to 1)
   * @param {Object} ball - Ball object
   * @param {Object} paddle - Paddle object
   * @returns {number} Hit position from -1 (top) to 1 (bottom)
   */
  calculateHitPosition(ball, paddle) {
    const paddleCenter = paddle.y + paddle.height / 2;
    const relativeY = ball.y - paddleCenter;
    const maxOffset = paddle.height / 2;
    return Utils.clamp(relativeY / maxOffset, -1, 1);
  },

  /**
   * Calculate bounce angle based on hit position
   * @param {Object} ball - Ball object
   * @param {Object} paddle - Paddle object
   * @returns {number} Bounce angle in radians
   */
  calculateBounceAngle(ball, paddle) {
    const hitPosition = this.calculateHitPosition(ball, paddle);
    // Max bounce angle is 60 degrees (PI/3)
    const maxAngle = Math.PI / 3;
    return hitPosition * maxAngle;
  },

  /**
   * Apply bounce physics to ball
   * @param {Object} ball - Ball object
   * @param {Object} paddle - Paddle object
   * @param {number} direction - 1 for right, -1 for left
   */
  applyBounce(ball, paddle, direction) {
    const angle = this.calculateBounceAngle(ball, paddle);

    // Increase speed slightly on each hit
    ball.speed = Math.min(ball.speed + CONFIG.GAME.BALL_SPEED_INCREMENT, 15);

    // Calculate new velocity
    ball.vx = direction * Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
  },

  /**
   * Reset ball to center with random direction
   * @param {Object} ball - Ball object to reset
   * @param {Object} canvas - Canvas dimensions
   * @param {number|null} serveDirection - 1 for right, -1 for left, null for random
   */
  resetBall(ball, canvas, serveDirection = null) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = CONFIG.GAME.BALL_SPEED;

    // Random direction if not specified
    const direction = serveDirection !== null ? serveDirection : (Math.random() < 0.5 ? 1 : -1);

    // Random angle between -30 and 30 degrees
    const angle = Utils.randomRange(-Math.PI / 6, Math.PI / 6);

    ball.vx = direction * Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
  },

  /**
   * Update paddle position with bounds checking
   * @param {Object} paddle - Paddle object
   * @param {number} targetY - Target Y position
   * @param {number} canvasHeight - Height of canvas
   * @param {number} speed - Movement speed
   */
  updatePaddle(paddle, targetY, canvasHeight, speed) {
    // Safety check - ensure paddle.y is valid
    if (!isFinite(paddle.y) || paddle.y === null) {
      paddle.y = (canvasHeight - paddle.height) / 2;
    }
    
    const centerY = paddle.y + paddle.height / 2;
    const diff = targetY - centerY;

    // Move toward target
    if (Math.abs(diff) > speed) {
      paddle.y += Math.sign(diff) * speed;
    } else {
      paddle.y = targetY - paddle.height / 2;
    }

    // Clamp to canvas bounds
    paddle.y = Utils.clamp(paddle.y, 0, canvasHeight - paddle.height);
  },

  /**
   * Predict where ball will intersect a vertical line (for AI)
   * @param {Object} ball - Ball object
   * @param {number} targetX - X position to predict intersection
   * @param {Object} canvas - Canvas dimensions
   * @returns {number} Predicted Y position
   */
  predictBallPosition(ball, targetX, canvas) {
    // If ball moving away from target, return center
    if ((ball.vx > 0 && targetX < ball.x) || (ball.vx < 0 && targetX > ball.x)) {
      return canvas.height / 2;
    }

    // Calculate time to reach target X
    const timeToTarget = Math.abs((targetX - ball.x) / ball.vx);

    // Predict Y position
    let predictedY = ball.y + ball.vy * timeToTarget;

    // Account for wall bounces
    const bounces = Math.floor(Math.abs(predictedY) / canvas.height);
    if (bounces > 0) {
      // Simulate bounces
      predictedY = predictedY % canvas.height;
      if (predictedY < 0) {
        predictedY = -predictedY;
      }
      if (bounces % 2 === 1) {
        predictedY = canvas.height - predictedY;
      }
    }

    return Utils.clamp(predictedY, 0, canvas.height);
  }
};

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Physics;
}
