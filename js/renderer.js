/**
 * Renderer module for Pong game
 * Handles all canvas drawing with synthwave aesthetic
 */

const Renderer = {
  // Color palette
  colors: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#1a1a2e',
    gridLines: '#330033',
    neonPink: '#ff00ff',
    neonCyan: '#00ffff',
    neonPurple: '#bf00ff',
    neonBlue: '#0080ff',
    neonOrange: '#ff6600',
    neonGreen: '#00ff88',
    white: '#ffffff',
    textGlow: '#ff00ff'
  },

  /**
   * Clear and draw background with gradient
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  drawBackground(ctx, canvas) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, this.colors.bgSecondary);
    gradient.addColorStop(1, this.colors.bgPrimary);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    this.drawGrid(ctx, canvas);
  },

  /**
   * Draw perspective grid pattern
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  drawGrid(ctx, canvas) {
    ctx.strokeStyle = this.colors.gridLines;
    ctx.lineWidth = 1;

    // Horizontal lines
    const lineSpacing = 30;
    for (let y = 0; y < canvas.height; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < canvas.width; x += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Center line (dashed)
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = this.colors.neonPurple;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },

  /**
   * Draw a paddle with glow effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} paddle - Paddle object {x, y, width, height}
   * @param {string} color - Paddle color
   * @param {number} glowIntensity - Glow blur amount
   */
  drawPaddle(ctx, paddle, color, glowIntensity = 20) {
    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = glowIntensity;

    // Gradient fill
    const gradient = ctx.createLinearGradient(
      paddle.x, paddle.y,
      paddle.x + paddle.width, paddle.y
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, this.colors.white);
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;

    // Draw rounded rectangle
    this.roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 3);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  },

  /**
   * Draw the ball with glow and optional trail
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} ball - Ball object {x, y, radius}
   * @param {Array} trail - Array of previous positions [{x, y}]
   * @param {string} color - Ball color
   */
  drawBall(ctx, ball, trail = [], color = null) {
    const ballColor = color || this.colors.white;
    const glowColor = this.colors.neonPurple;

    // Draw trail
    if (trail && trail.length > 0) {
      for (let i = 0; i < trail.length; i++) {
        const alpha = (i + 1) / trail.length * 0.5;
        const radius = ball.radius * 0.8 * (i + 1) / trail.length;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, radius, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Main ball with glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 30;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;
  },

  /**
   * Draw score display
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} score1 - Player 1 score
   * @param {number} score2 - Player 2 score
   */
  drawScore(ctx, canvas, score1, score2) {
    ctx.font = 'bold 48px "Press Start 2P", "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Glow effect
    ctx.shadowColor = this.colors.neonPink;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.colors.white;

    // Player 1 score (left)
    ctx.fillText(String(score1), canvas.width / 4, 30);

    // Player 2 score (right)
    ctx.fillText(String(score2), (canvas.width / 4) * 3, 30);

    // Reset shadow
    ctx.shadowBlur = 0;
  },

  /**
   * Draw a power-up
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} powerup - Power-up object {x, y, type, radius}
   */
  drawPowerUp(ctx, powerup) {
    const colors = {
      bigPaddle: this.colors.neonGreen,
      smallEnemy: this.colors.neonOrange,
      speedBall: this.colors.neonOrange,
      slowBall: this.colors.neonBlue,
      shield: this.colors.neonCyan,
      default: this.colors.neonPink
    };

    const color = colors[powerup.type] || colors.default;

    // Pulsing effect
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.2;
    const radius = (powerup.radius || 15) * pulse;

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    // Draw power-up circle
    ctx.beginPath();
    ctx.arc(powerup.x, powerup.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Inner circle
    ctx.beginPath();
    ctx.arc(powerup.x, powerup.y, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.white;
    ctx.fill();

    ctx.shadowBlur = 0;
  },

  /**
   * Draw particles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} particles - Array of particle objects
   */
  drawParticles(ctx, particles) {
    for (const particle of particles) {
      if (particle.life <= 0) {
        continue;
      }

      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, 3, 3);
    }
    ctx.globalAlpha = 1;
  },

  /**
   * Draw countdown text
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number|string} count - Countdown value
   */
  drawCountdown(ctx, canvas, count) {
    ctx.font = 'bold 72px "Press Start 2P", "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = this.colors.neonCyan;
    ctx.shadowBlur = 30;
    ctx.fillStyle = this.colors.white;

    ctx.fillText(String(count), canvas.width / 2, canvas.height / 2);

    ctx.shadowBlur = 0;
  },

  /**
   * Draw game over screen
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} winner - Winner player number (1 or 2)
   * @param {number} score1 - Player 1 final score
   * @param {number} score2 - Player 2 final score
   */
  drawGameOver(ctx, canvas, winner, score1, score2) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Winner text
    ctx.font = 'bold 32px "Press Start 2P", "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const winnerColor = winner === 1 ? this.colors.neonCyan : this.colors.neonPink;
    ctx.shadowColor = winnerColor;
    ctx.shadowBlur = 30;
    ctx.fillStyle = this.colors.white;

    const winnerText = winner === 1 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
    ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 60);

    // Final score
    ctx.font = 'bold 48px "Press Start 2P", "Orbitron", monospace';
    ctx.fillText(`${score1} - ${score2}`, canvas.width / 2, canvas.height / 2 + 20);

    // Instructions
    ctx.font = '16px "Press Start 2P", "Orbitron", monospace';
    ctx.fillStyle = this.colors.neonPurple;
    ctx.shadowColor = this.colors.neonPurple;
    ctx.shadowBlur = 10;
    ctx.fillText('PRESS SPACE OR TAP TO CONTINUE', canvas.width / 2, canvas.height / 2 + 100);

    ctx.shadowBlur = 0;
  },

  /**
   * Draw pause overlay
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  drawPause(ctx, canvas) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paused text
    ctx.font = 'bold 48px "Press Start 2P", "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = this.colors.neonCyan;
    ctx.shadowBlur = 30;
    ctx.fillStyle = this.colors.white;

    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '16px "Press Start 2P", "Orbitron", monospace';
    ctx.fillText('PRESS ESC OR TAP TO RESUME', canvas.width / 2, canvas.height / 2 + 60);

    ctx.shadowBlur = 0;
  },

  /**
   * Helper: Draw rounded rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {number} radius - Corner radius
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
};
