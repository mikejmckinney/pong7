/**
 * Unit tests for AI module
 */

const path = require('path');

// Load dependencies in order
const CONFIG = require(path.join(__dirname, '../../js/config.js'));
global.CONFIG = CONFIG;

const Utils = require(path.join(__dirname, '../../js/utils.js'));
global.Utils = Utils;

const Physics = require(path.join(__dirname, '../../js/physics.js'));
global.Physics = Physics;

const AI = require(path.join(__dirname, '../../js/ai.js'));

describe('AI', () => {
  describe('constructor', () => {
    test('creates AI with default medium difficulty', () => {
      const ai = new AI();
      expect(ai.difficulty).toBe('medium');
    });

    test('creates AI with specified difficulty', () => {
      const ai = new AI('hard');
      expect(ai.difficulty).toBe('hard');
    });

    test('initializes with null target', () => {
      const ai = new AI();
      expect(ai.targetY).toBeNull();
    });

    test('initializes with zero mistake', () => {
      const ai = new AI();
      expect(ai.currentMistake).toBe(0);
    });
  });

  describe('setDifficulty', () => {
    test('sets easy difficulty with correct settings', () => {
      const ai = new AI();
      ai.setDifficulty('easy');
      
      expect(ai.difficulty).toBe('easy');
      expect(ai.reactionDelay).toBe(CONFIG.AI.EASY.reactionDelay);
      expect(ai.mistakeChance).toBe(CONFIG.AI.EASY.mistakeChance);
      expect(ai.maxSpeedMultiplier).toBe(CONFIG.AI.EASY.maxSpeedMultiplier);
      expect(ai.predictionError).toBe(CONFIG.AI.EASY.predictionError);
    });

    test('sets medium difficulty with correct settings', () => {
      const ai = new AI();
      ai.setDifficulty('medium');
      
      expect(ai.difficulty).toBe('medium');
      expect(ai.reactionDelay).toBe(CONFIG.AI.MEDIUM.reactionDelay);
    });

    test('sets hard difficulty with correct settings', () => {
      const ai = new AI();
      ai.setDifficulty('hard');
      
      expect(ai.difficulty).toBe('hard');
      expect(ai.reactionDelay).toBe(CONFIG.AI.HARD.reactionDelay);
    });

    test('sets impossible difficulty with correct settings', () => {
      const ai = new AI();
      ai.setDifficulty('impossible');
      
      expect(ai.difficulty).toBe('impossible');
      expect(ai.reactionDelay).toBe(CONFIG.AI.IMPOSSIBLE.reactionDelay);
    });

    test('handles case-insensitive difficulty', () => {
      const ai = new AI();
      ai.setDifficulty('HARD');
      expect(ai.difficulty).toBe('hard');
      
      ai.setDifficulty('Easy');
      expect(ai.difficulty).toBe('easy');
    });

    test('falls back to medium for unknown difficulty', () => {
      const ai = new AI();
      ai.setDifficulty('nonexistent');
      
      expect(ai.reactionDelay).toBe(CONFIG.AI.MEDIUM.reactionDelay);
    });
  });

  describe('update', () => {
    let ai;
    const canvas = { width: 800, height: 600 };
    const paddle = { x: 780, y: 270, width: 10, height: 60 };

    beforeEach(() => {
      ai = new AI('medium');
      // Reset performance.now mock
      jest.spyOn(performance, 'now').mockReturnValue(0);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns canvas center when no target set', () => {
      const ball = { x: 100, y: 100, vx: 5, vy: 0, radius: 5, speed: 5 };
      
      const targetY = ai.update(ball, paddle, canvas);
      
      expect(targetY).toBe(300); // canvas.height / 2
    });

    test('updates target when reaction delay elapsed', () => {
      const ball = { x: 100, y: 200, vx: 5, vy: 0, radius: 5, speed: 5 };
      
      // First call
      ai.update(ball, paddle, canvas);
      
      // Advance time past reaction delay
      jest.spyOn(performance, 'now').mockReturnValue(ai.reactionDelay + 1);
      
      ai.update(ball, paddle, canvas);
      
      expect(ai.targetY).not.toBeNull();
    });

    test('applies mistake when random chance triggers', () => {
      const ball = { x: 100, y: 300, vx: 5, vy: 0, radius: 5, speed: 5 };
      
      // Force mistake to trigger
      jest.spyOn(Math, 'random').mockReturnValue(0);
      
      jest.spyOn(performance, 'now').mockReturnValue(ai.reactionDelay + 1);
      ai.update(ball, paddle, canvas);
      
      // With Math.random returning 0, which is less than mistakeChance (0.05 for medium),
      // the mistake should be applied and currentMistake should be non-zero
      expect(ai.currentMistake).not.toBe(0);
    });
  });

  describe('calculateTargetY', () => {
    let ai;
    const canvas = { width: 800, height: 600 };
    const paddle = { x: 780, y: 270, width: 10, height: 60 };

    beforeEach(() => {
      ai = new AI();
    });

    test('returns center when ball moving away (vx <= 0)', () => {
      const ball = { x: 100, y: 200, vx: -5, vy: 0, radius: 5, speed: 5 };
      
      const targetY = ai.calculateTargetY(ball, paddle, canvas);
      
      expect(targetY).toBe(300); // canvas.height / 2
    });

    test('returns center when ball stationary', () => {
      const ball = { x: 100, y: 200, vx: 0, vy: 0, radius: 5, speed: 5 };
      
      const targetY = ai.calculateTargetY(ball, paddle, canvas);
      
      expect(targetY).toBe(300);
    });

    test('easy difficulty uses simple tracking with error', () => {
      ai.setDifficulty('easy');
      const ball = { x: 100, y: 200, vx: 5, vy: 0, radius: 5, speed: 5 };
      
      const targetY = ai.calculateTargetY(ball, paddle, canvas);
      
      // Should be within prediction error range around ball.y
      expect(targetY).toBeGreaterThanOrEqual(ball.y - ai.predictionError);
      expect(targetY).toBeLessThanOrEqual(ball.y + ai.predictionError);
    });

    test('harder difficulties use prediction', () => {
      ai.setDifficulty('hard');
      const ball = { x: 100, y: 200, vx: 5, vy: 0, radius: 5, speed: 5 };
      
      const targetY = ai.calculateTargetY(ball, paddle, canvas);
      
      // Should be a reasonable Y value
      expect(targetY).toBeGreaterThanOrEqual(0);
      expect(targetY).toBeLessThanOrEqual(canvas.height);
    });
  });

  describe('getSpeedMultiplier', () => {
    test('returns correct multiplier for each difficulty', () => {
      const aiEasy = new AI('easy');
      const aiMedium = new AI('medium');
      const aiHard = new AI('hard');
      const aiImpossible = new AI('impossible');
      
      expect(aiEasy.getSpeedMultiplier()).toBe(CONFIG.AI.EASY.maxSpeedMultiplier);
      expect(aiMedium.getSpeedMultiplier()).toBe(CONFIG.AI.MEDIUM.maxSpeedMultiplier);
      expect(aiHard.getSpeedMultiplier()).toBe(CONFIG.AI.HARD.maxSpeedMultiplier);
      expect(aiImpossible.getSpeedMultiplier()).toBe(CONFIG.AI.IMPOSSIBLE.maxSpeedMultiplier);
    });
  });

  describe('movePaddle', () => {
    test('moves paddle toward target using Physics.updatePaddle', () => {
      const ai = new AI('medium');
      const paddle = { y: 100, height: 60 };
      const targetY = 200;
      const baseSpeed = 10;
      const canvasHeight = 600;
      
      ai.movePaddle(paddle, targetY, baseSpeed, canvasHeight);
      
      // Paddle should move toward target
      expect(paddle.y).toBeGreaterThan(100);
    });

    test('respects AI speed multiplier', () => {
      const aiSlow = new AI('easy');
      const aiFast = new AI('impossible');
      
      const paddle1 = { y: 100, height: 60 };
      const paddle2 = { y: 100, height: 60 };
      const targetY = 300;
      const baseSpeed = 10;
      const canvasHeight = 600;
      
      aiSlow.movePaddle(paddle1, targetY, baseSpeed, canvasHeight);
      aiFast.movePaddle(paddle2, targetY, baseSpeed, canvasHeight);
      
      // Faster AI should move paddle further
      expect(paddle2.y).toBeGreaterThan(paddle1.y);
    });
  });

  describe('reset', () => {
    test('resets target to null', () => {
      const ai = new AI();
      ai.targetY = 200;
      
      ai.reset();
      
      expect(ai.targetY).toBeNull();
    });

    test('resets lastUpdateTime to 0', () => {
      const ai = new AI();
      ai.lastUpdateTime = 1000;
      
      ai.reset();
      
      expect(ai.lastUpdateTime).toBe(0);
    });

    test('resets currentMistake to 0', () => {
      const ai = new AI();
      ai.currentMistake = 50;
      
      ai.reset();
      
      expect(ai.currentMistake).toBe(0);
    });
  });

  describe('difficulty progression', () => {
    test('easy AI is slower than medium', () => {
      const easy = new AI('easy');
      const medium = new AI('medium');
      
      expect(easy.maxSpeedMultiplier).toBeLessThan(medium.maxSpeedMultiplier);
    });

    test('medium AI is slower than hard', () => {
      const medium = new AI('medium');
      const hard = new AI('hard');
      
      expect(medium.maxSpeedMultiplier).toBeLessThan(hard.maxSpeedMultiplier);
    });

    test('hard and impossible AI have max speed', () => {
      const hard = new AI('hard');
      const impossible = new AI('impossible');
      
      // Both hard and impossible have max speed multiplier
      expect(hard.maxSpeedMultiplier).toBe(1.0);
      expect(impossible.maxSpeedMultiplier).toBe(1.0);
      // Impossible has lower reaction delay
      expect(impossible.reactionDelay).toBeLessThan(hard.reactionDelay);
    });

    test('easy AI has longer reaction delay', () => {
      const easy = new AI('easy');
      const hard = new AI('hard');
      
      expect(easy.reactionDelay).toBeGreaterThan(hard.reactionDelay);
    });

    test('easy AI has higher mistake chance', () => {
      const easy = new AI('easy');
      const hard = new AI('hard');
      
      expect(easy.mistakeChance).toBeGreaterThan(hard.mistakeChance);
    });
  });
});
