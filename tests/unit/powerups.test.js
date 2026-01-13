/**
 * Unit tests for PowerUpManager module
 */

const path = require('path');

// Load dependencies in order
const CONFIG = require(path.join(__dirname, '../../js/config.js'));
global.CONFIG = CONFIG;

const Utils = require(path.join(__dirname, '../../js/utils.js'));
global.Utils = Utils;

// Mock sound object
global.sound = {
  powerUpSpawn: jest.fn(),
  powerUpCollect: jest.fn()
};

// Mock Renderer
global.Renderer = {
  drawPowerUp: jest.fn()
};

// Load PowerUpManager module
const { PowerUpManager, POWERUP_TYPES, POWERUP_TYPE_KEYS } = require(path.join(__dirname, '../../js/powerups.js'));

describe('PowerUpManager', () => {
  let manager;
  let mockCanvas;

  beforeEach(() => {
    manager = new PowerUpManager();
    mockCanvas = { width: 800, height: 600 };
    jest.clearAllMocks();
  });

  afterEach(() => {
    manager.reset();
  });

  describe('constructor', () => {
    test('initializes with empty arrays and default modifiers', () => {
      expect(manager.active).toEqual([]);
      expect(manager.effects).toEqual([]);
      expect(manager.spawnsActive).toBe(false);
      expect(manager.modifiers.paddle1SizeMultiplier).toBe(1.0);
      expect(manager.modifiers.paddle2SizeMultiplier).toBe(1.0);
    });
  });

  describe('spawn', () => {
    test('creates a power-up with valid properties', () => {
      manager.spawn(mockCanvas);

      expect(manager.active.length).toBe(1);
      const powerup = manager.active[0];
      
      expect(powerup.x).toBeGreaterThanOrEqual(mockCanvas.width * 0.3);
      expect(powerup.x).toBeLessThanOrEqual(mockCanvas.width * 0.7);
      expect(powerup.y).toBeGreaterThanOrEqual(100);
      expect(powerup.y).toBeLessThanOrEqual(mockCanvas.height - 100);
      expect(powerup.radius).toBe(15);
      expect(powerup.type).toBeDefined();
      expect(powerup.color).toBeDefined();
      expect(sound.powerUpSpawn).toHaveBeenCalled();
    });

    test('limits active power-ups to 3', () => {
      manager.spawn(mockCanvas);
      manager.spawn(mockCanvas);
      manager.spawn(mockCanvas);
      manager.spawn(mockCanvas); // Should not add

      expect(manager.active.length).toBe(3);
    });
  });

  describe('update', () => {
    test('removes expired power-ups', () => {
      manager.spawn(mockCanvas);
      manager.active[0].spawnTime = performance.now() - 20000; // Expired
      
      const ball = { x: 0, y: 0, radius: 5, vx: 1, vy: 0 };
      manager.update(0, ball);

      expect(manager.active.length).toBe(0);
    });

    test('detects collision with ball and collects power-up', () => {
      manager.spawn(mockCanvas);
      const powerup = manager.active[0];
      
      // Place ball on top of power-up
      const ball = { 
        x: powerup.x, 
        y: powerup.y, 
        radius: 10, 
        vx: 5, 
        vy: 0 
      };
      
      manager.update(0, ball);

      expect(manager.active.length).toBe(0);
      expect(sound.powerUpCollect).toHaveBeenCalled();
    });
  });

  describe('collect', () => {
    test('adds effect to effects array for timed power-ups', () => {
      const powerup = {
        type: 'bigPaddle',
        color: '#00ff88'
      };

      manager.collect(powerup, 1);

      expect(manager.effects.length).toBe(1);
      expect(manager.effects[0].type).toBe('bigPaddle');
      expect(manager.effects[0].player).toBe(1);
    });

    test('sets shield modifier for shield power-up', () => {
      const powerup = {
        type: 'shield',
        color: '#00ffff'
      };

      manager.collect(powerup, 1);

      expect(manager.modifiers.player1Shield).toBe(true);
    });

    test('sets fireball modifier for fireball power-up', () => {
      const powerup = {
        type: 'fireball',
        color: '#ff4400'
      };

      manager.collect(powerup, 2);

      expect(manager.modifiers.fireball).toBe(true);
    });
  });

  describe('updateEffects', () => {
    test('applies bigPaddle effect to correct player', () => {
      manager.effects.push({
        type: 'bigPaddle',
        player: 1,
        duration: 10000,
        endTime: performance.now() + 10000
      });

      manager.updateEffects(performance.now());

      expect(manager.modifiers.paddle1SizeMultiplier).toBe(1.5);
      expect(manager.modifiers.paddle2SizeMultiplier).toBe(1.0);
    });

    test('applies smallEnemy effect to opponent', () => {
      manager.effects.push({
        type: 'smallEnemy',
        player: 1,
        duration: 10000,
        endTime: performance.now() + 10000
      });

      manager.updateEffects(performance.now());

      expect(manager.modifiers.paddle2SizeMultiplier).toBe(0.7);
      expect(manager.modifiers.paddle1SizeMultiplier).toBe(1.0);
    });

    test('applies speedBall effect', () => {
      manager.effects.push({
        type: 'speedBall',
        player: 1,
        duration: -1,
        endTime: Infinity
      });

      manager.updateEffects(performance.now());

      expect(manager.modifiers.ballSpeedMultiplier).toBe(1.5);
    });

    test('applies slowBall effect', () => {
      manager.effects.push({
        type: 'slowBall',
        player: 1,
        duration: 8000,
        endTime: performance.now() + 8000
      });

      manager.updateEffects(performance.now());

      expect(manager.modifiers.ballSpeedMultiplier).toBe(0.6);
    });

    test('applies slowMotion effect', () => {
      manager.effects.push({
        type: 'slowMotion',
        player: 1,
        duration: 5000,
        endTime: performance.now() + 5000
      });

      manager.updateEffects(performance.now());

      expect(manager.modifiers.gameSpeedMultiplier).toBe(0.5);
    });

    test('applies reverse effect to opponent', () => {
      manager.effects.push({
        type: 'reverse',
        player: 1,
        duration: 8000,
        endTime: performance.now() + 8000
      });

      manager.updateEffects(performance.now());

      expect(manager.modifiers.player2Reversed).toBe(true);
      expect(manager.modifiers.player1Reversed).toBe(false);
    });

    test('removes expired effects', () => {
      manager.effects.push({
        type: 'bigPaddle',
        player: 1,
        duration: 10000,
        endTime: performance.now() - 1000 // Already expired
      });

      manager.updateEffects(performance.now());

      expect(manager.effects.length).toBe(0);
      expect(manager.modifiers.paddle1SizeMultiplier).toBe(1.0);
    });
  });

  describe('useShield', () => {
    test('returns true and removes shield when available', () => {
      manager.modifiers.player1Shield = true;
      manager.effects.push({
        type: 'shield',
        player: 1,
        duration: -1,
        endTime: Infinity
      });

      const result = manager.useShield(1);

      expect(result).toBe(true);
      expect(manager.modifiers.player1Shield).toBe(false);
      expect(manager.effects.length).toBe(0);
    });

    test('returns false when no shield available', () => {
      const result = manager.useShield(1);

      expect(result).toBe(false);
    });
  });

  describe('useFireball', () => {
    test('returns true and removes fireball when available', () => {
      manager.modifiers.fireball = true;
      manager.effects.push({
        type: 'fireball',
        player: 1,
        duration: -1,
        endTime: Infinity
      });

      const result = manager.useFireball();

      expect(result).toBe(true);
      expect(manager.modifiers.fireball).toBe(false);
      expect(manager.effects.length).toBe(0);
    });

    test('returns false when no fireball available', () => {
      const result = manager.useFireball();

      expect(result).toBe(false);
    });
  });

  describe('clearPointEffects', () => {
    test('removes speedBall effect on point scored', () => {
      manager.effects.push({
        type: 'speedBall',
        player: 1,
        duration: -1,
        endTime: Infinity
      });
      manager.effects.push({
        type: 'bigPaddle',
        player: 1,
        duration: 10000,
        endTime: performance.now() + 10000
      });

      manager.clearPointEffects();

      expect(manager.effects.length).toBe(1);
      expect(manager.effects[0].type).toBe('bigPaddle');
    });
  });

  describe('reset', () => {
    test('clears all power-ups and effects', () => {
      manager.spawn(mockCanvas);
      manager.effects.push({
        type: 'bigPaddle',
        player: 1,
        duration: 10000,
        endTime: performance.now() + 10000
      });
      manager.modifiers.paddle1SizeMultiplier = 1.5;
      manager.modifiers.player1Shield = true;

      manager.reset();

      expect(manager.active.length).toBe(0);
      expect(manager.effects.length).toBe(0);
      expect(manager.modifiers.paddle1SizeMultiplier).toBe(1.0);
      expect(manager.modifiers.player1Shield).toBe(false);
    });
  });

  describe('hasEffect', () => {
    test('returns true when effect is active for player', () => {
      manager.effects.push({
        type: 'bigPaddle',
        player: 1,
        duration: 10000,
        endTime: performance.now() + 10000
      });

      expect(manager.hasEffect('bigPaddle', 1)).toBe(true);
      expect(manager.hasEffect('bigPaddle', 2)).toBe(false);
      expect(manager.hasEffect('slowBall', 1)).toBe(false);
    });
  });

  describe('getPaddleSizeMultiplier', () => {
    test('returns correct multiplier for each player', () => {
      manager.modifiers.paddle1SizeMultiplier = 1.5;
      manager.modifiers.paddle2SizeMultiplier = 0.7;

      expect(manager.getPaddleSizeMultiplier(1)).toBe(1.5);
      expect(manager.getPaddleSizeMultiplier(2)).toBe(0.7);
    });
  });

  describe('isReversed', () => {
    test('returns correct reversed state for each player', () => {
      manager.modifiers.player1Reversed = true;
      manager.modifiers.player2Reversed = false;

      expect(manager.isReversed(1)).toBe(true);
      expect(manager.isReversed(2)).toBe(false);
    });
  });

  describe('startSpawns / stopSpawns', () => {
    test('sets spawnsActive flag correctly', () => {
      expect(manager.spawnsActive).toBe(false);

      manager.startSpawns(mockCanvas);
      expect(manager.spawnsActive).toBe(true);

      manager.stopSpawns();
      expect(manager.spawnsActive).toBe(false);
    });

    test('stopSpawns clears timeout', () => {
      manager.startSpawns(mockCanvas);
      expect(manager.spawnTimeoutId).not.toBeNull();

      manager.stopSpawns();
      expect(manager.spawnTimeoutId).toBeNull();
    });
  });
});

describe('POWERUP_TYPES', () => {
  test('has 10 power-up types defined', () => {
    expect(Object.keys(POWERUP_TYPES).length).toBe(10);
  });

  test('each power-up has required properties', () => {
    for (const key of Object.keys(POWERUP_TYPES)) {
      const powerup = POWERUP_TYPES[key];
      expect(powerup.name).toBeDefined();
      expect(powerup.duration).toBeDefined();
      expect(powerup.color).toBeDefined();
      expect(powerup.description).toBeDefined();
      expect(powerup.icon).toBeDefined();
    }
  });

  test('power-up names match expected values', () => {
    expect(POWERUP_TYPES.BIG_PADDLE.name).toBe('bigPaddle');
    expect(POWERUP_TYPES.SMALL_ENEMY.name).toBe('smallEnemy');
    expect(POWERUP_TYPES.SPEED_BALL.name).toBe('speedBall');
    expect(POWERUP_TYPES.SLOW_BALL.name).toBe('slowBall');
    expect(POWERUP_TYPES.SHIELD.name).toBe('shield');
    expect(POWERUP_TYPES.MULTI_BALL.name).toBe('multiBall');
    expect(POWERUP_TYPES.FIREBALL.name).toBe('fireball');
    expect(POWERUP_TYPES.REVERSE.name).toBe('reverse');
    expect(POWERUP_TYPES.CURVE_SHOT.name).toBe('curveShot');
    expect(POWERUP_TYPES.SLOW_MOTION.name).toBe('slowMotion');
  });
});
