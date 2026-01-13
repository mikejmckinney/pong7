/**
 * Unit tests for Utils module
 */

const path = require('path');

// Load the Utils module
const Utils = require(path.join(__dirname, '../../js/utils.js'));

describe('Utils', () => {
  describe('lerp', () => {
    test('returns start value when t=0', () => {
      expect(Utils.lerp(0, 100, 0)).toBe(0);
    });

    test('returns end value when t=1', () => {
      expect(Utils.lerp(0, 100, 1)).toBe(100);
    });

    test('returns midpoint when t=0.5', () => {
      expect(Utils.lerp(0, 100, 0.5)).toBe(50);
    });

    test('works with negative values', () => {
      expect(Utils.lerp(-100, 100, 0.5)).toBe(0);
    });
  });

  describe('clamp', () => {
    test('clamps value below minimum', () => {
      expect(Utils.clamp(-10, 0, 100)).toBe(0);
    });

    test('clamps value above maximum', () => {
      expect(Utils.clamp(150, 0, 100)).toBe(100);
    });

    test('returns value within range', () => {
      expect(Utils.clamp(50, 0, 100)).toBe(50);
    });

    test('handles edge cases at boundaries', () => {
      expect(Utils.clamp(0, 0, 100)).toBe(0);
      expect(Utils.clamp(100, 0, 100)).toBe(100);
    });
  });

  describe('randomRange', () => {
    test('returns value within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = Utils.randomRange(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThan(20);
      }
    });

    test('handles same min and max', () => {
      expect(Utils.randomRange(5, 5)).toBe(5);
    });
  });

  describe('randomInt', () => {
    test('returns integer within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = Utils.randomInt(1, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('distance', () => {
    test('calculates distance between two points', () => {
      expect(Utils.distance(0, 0, 3, 4)).toBe(5);
    });

    test('returns 0 for same point', () => {
      expect(Utils.distance(5, 5, 5, 5)).toBe(0);
    });
  });

  describe('pointInRect', () => {
    test('detects point inside rectangle', () => {
      expect(Utils.pointInRect(50, 50, 0, 0, 100, 100)).toBe(true);
    });

    test('detects point outside rectangle', () => {
      expect(Utils.pointInRect(150, 50, 0, 0, 100, 100)).toBe(false);
    });

    test('handles edge cases at boundaries', () => {
      expect(Utils.pointInRect(0, 0, 0, 0, 100, 100)).toBe(true);
      expect(Utils.pointInRect(100, 100, 0, 0, 100, 100)).toBe(true);
    });
  });

  describe('rectOverlap', () => {
    test('detects overlapping rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 100, height: 100 };
      const rect2 = { x: 50, y: 50, width: 100, height: 100 };
      expect(Utils.rectOverlap(rect1, rect2)).toBe(true);
    });

    test('detects non-overlapping rectangles', () => {
      const rect1 = { x: 0, y: 0, width: 50, height: 50 };
      const rect2 = { x: 100, y: 100, width: 50, height: 50 };
      expect(Utils.rectOverlap(rect1, rect2)).toBe(false);
    });
  });

  describe('generateUsername', () => {
    test('generates username starting with Player', () => {
      const username = Utils.generateUsername();
      expect(username.startsWith('Player')).toBe(true);
    });

    test('generates different usernames', () => {
      const usernames = new Set();
      for (let i = 0; i < 10; i++) {
        usernames.add(Utils.generateUsername());
      }
      // Should have at least some unique names (statistically)
      expect(usernames.size).toBeGreaterThan(1);
    });
  });

  describe('formatTime', () => {
    test('formats milliseconds as MM:SS', () => {
      expect(Utils.formatTime(0)).toBe('00:00');
      expect(Utils.formatTime(60000)).toBe('01:00');
      expect(Utils.formatTime(65000)).toBe('01:05');
      expect(Utils.formatTime(3661000)).toBe('61:01');
    });
  });

  describe('padNumber', () => {
    test('pads single digit numbers', () => {
      expect(Utils.padNumber(5, 2)).toBe('05');
    });

    test('does not pad numbers already at size', () => {
      expect(Utils.padNumber(12, 2)).toBe('12');
    });
  });
});
