/**
 * Unit tests for Physics module
 */

const fs = require('fs');
const path = require('path');

// Load dependencies
const configCode = fs.readFileSync(path.join(__dirname, '../../js/config.js'), 'utf8');
const utilsCode = fs.readFileSync(path.join(__dirname, '../../js/utils.js'), 'utf8');
const physicsCode = fs.readFileSync(path.join(__dirname, '../../js/physics.js'), 'utf8');

// Create modules using Function constructor
// eslint-disable-next-line no-new-func
const CONFIG = new Function(`${configCode}\nreturn CONFIG;`)();
// eslint-disable-next-line no-new-func
const Utils = new Function(`${utilsCode}\nreturn Utils;`)();
// eslint-disable-next-line no-new-func
const Physics = new Function('CONFIG', 'Utils', `${physicsCode}\nreturn Physics;`)(CONFIG, Utils);

describe('Physics', () => {
  describe('checkPaddleCollision', () => {
    const paddle = { x: 10, y: 50, width: 10, height: 60 };

    test('detects collision when ball hits paddle', () => {
      const ball = { x: 22, y: 80, radius: 5, vx: -5, vy: 0 };
      expect(Physics.checkPaddleCollision(ball, paddle)).toBe(true);
    });

    test('no collision when ball misses paddle vertically', () => {
      const ball = { x: 22, y: 200, radius: 5, vx: -5, vy: 0 };
      expect(Physics.checkPaddleCollision(ball, paddle)).toBe(false);
    });

    test('no collision when ball is moving away', () => {
      const ball = { x: 22, y: 80, radius: 5, vx: 5, vy: 0 };
      expect(Physics.checkPaddleCollision(ball, paddle)).toBe(false);
    });
  });

  describe('calculateHitPosition', () => {
    const paddle = { y: 50, height: 60 };

    test('returns 0 for center hit', () => {
      const ball = { y: 80 }; // paddle center is at 80 (50 + 60/2)
      const hitPos = Physics.calculateHitPosition(ball, paddle);
      expect(hitPos).toBeCloseTo(0, 1);
    });

    test('returns negative value for top hit', () => {
      const ball = { y: 55 };
      const hitPos = Physics.calculateHitPosition(ball, paddle);
      expect(hitPos).toBeLessThan(0);
    });

    test('returns positive value for bottom hit', () => {
      const ball = { y: 105 };
      const hitPos = Physics.calculateHitPosition(ball, paddle);
      expect(hitPos).toBeGreaterThan(0);
    });

    test('clamps to -1 to 1 range', () => {
      const ball1 = { y: 0 };
      const ball2 = { y: 200 };
      expect(Physics.calculateHitPosition(ball1, paddle)).toBeGreaterThanOrEqual(-1);
      expect(Physics.calculateHitPosition(ball2, paddle)).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateBounceAngle', () => {
    const paddle = { y: 50, height: 60 };

    test('returns angle based on hit position', () => {
      const ball = { x: 20, y: 80 }; // center hit
      const angle = Physics.calculateBounceAngle(ball, paddle);
      expect(angle).toBeCloseTo(0, 1);
    });

    test('angle is within bounds', () => {
      const ball = { x: 20, y: 50 }; // top edge
      const angle = Physics.calculateBounceAngle(ball, paddle);
      expect(Math.abs(angle)).toBeLessThanOrEqual(Math.PI / 3);
    });
  });

  describe('resetBall', () => {
    test('centers ball on canvas', () => {
      const ball = { x: 0, y: 0, speed: 0, vx: 0, vy: 0 };
      const canvas = { width: 800, height: 600 };
      Physics.resetBall(ball, canvas);
      
      expect(ball.x).toBe(400);
      expect(ball.y).toBe(300);
      expect(ball.speed).toBe(CONFIG.GAME.BALL_SPEED);
    });

    test('sets velocity in specified direction', () => {
      const ball = { x: 0, y: 0, speed: 0, vx: 0, vy: 0 };
      const canvas = { width: 800, height: 600 };
      
      Physics.resetBall(ball, canvas, 1);
      expect(ball.vx).toBeGreaterThan(0);
      
      Physics.resetBall(ball, canvas, -1);
      expect(ball.vx).toBeLessThan(0);
    });
  });

  describe('updatePaddle', () => {
    test('moves paddle toward target', () => {
      const paddle = { y: 100, height: 60 };
      Physics.updatePaddle(paddle, 200, 600, 10);
      expect(paddle.y).toBeGreaterThan(100);
    });

    test('clamps paddle to canvas bounds', () => {
      const paddle = { y: 0, height: 60 };
      Physics.updatePaddle(paddle, -100, 600, 10);
      expect(paddle.y).toBeGreaterThanOrEqual(0);
      
      const paddle2 = { y: 540, height: 60 };
      Physics.updatePaddle(paddle2, 700, 600, 10);
      expect(paddle2.y).toBeLessThanOrEqual(540);
    });
  });

  describe('updateBall', () => {
    test('moves ball by velocity', () => {
      const ball = { x: 100, y: 100, vx: 5, vy: 3, radius: 5, speed: 5 };
      const paddle1 = { x: 10, y: 50, width: 10, height: 60 };
      const paddle2 = { x: 780, y: 50, width: 10, height: 60 };
      const canvas = { width: 800, height: 600 };
      
      Physics.updateBall(ball, paddle1, paddle2, canvas);
      
      expect(ball.x).toBe(105);
      expect(ball.y).toBe(103);
    });

    test('detects wall collision', () => {
      const ball = { x: 100, y: 3, vx: 5, vy: -5, radius: 5, speed: 5 };
      const paddle1 = { x: 10, y: 50, width: 10, height: 60 };
      const paddle2 = { x: 780, y: 50, width: 10, height: 60 };
      const canvas = { width: 800, height: 600 };
      
      const result = Physics.updateBall(ball, paddle1, paddle2, canvas);
      
      expect(result.hitWall).toBe(true);
      expect(ball.vy).toBeGreaterThan(0); // Bounced
    });

    test('detects scoring', () => {
      const ball = { x: -5, y: 100, vx: -5, vy: 0, radius: 5, speed: 5 };
      const paddle1 = { x: 10, y: 200, width: 10, height: 60 };
      const paddle2 = { x: 780, y: 200, width: 10, height: 60 };
      const canvas = { width: 800, height: 600 };
      
      const result = Physics.updateBall(ball, paddle1, paddle2, canvas);
      
      expect(result.scored).toBe(2);
    });
  });

  describe('predictBallPosition', () => {
    test('predicts ball position at target X', () => {
      const ball = { x: 100, y: 100, vx: 5, vy: 0 };
      const canvas = { width: 800, height: 600 };
      
      const predictedY = Physics.predictBallPosition(ball, 200, canvas);
      
      expect(predictedY).toBeCloseTo(100, 0);
    });

    test('returns center when ball moving away', () => {
      const ball = { x: 100, y: 100, vx: 5, vy: 0 };
      const canvas = { width: 800, height: 600 };
      
      const predictedY = Physics.predictBallPosition(ball, 50, canvas);
      
      expect(predictedY).toBe(300); // center
    });
  });
});
