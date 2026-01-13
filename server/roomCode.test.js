/**
 * Tests for room code generation
 */

const { generateRoomCode, generateUniqueRoomCode } = require('./lib/roomCode');
const { ROOM_CODE } = require('./lib/validation');

describe('Room Code Module', () => {
  describe('generateRoomCode', () => {
    test('generates 6 character code', () => {
      const code = generateRoomCode();
      expect(code.length).toBe(ROOM_CODE.LENGTH);
    });

    test('generates uppercase alphanumeric code', () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    test('generates different codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // With random generation, we should get mostly unique codes
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('generateUniqueRoomCode', () => {
    test('generates code not in existing set', () => {
      const existing = new Set(['ABC123', 'DEF456']);
      const code = generateUniqueRoomCode(existing);
      expect(code).not.toBeNull();
      expect(existing.has(code)).toBe(false);
    });

    test('works with Map', () => {
      const existing = new Map([['ABC123', {}], ['DEF456', {}]]);
      const code = generateUniqueRoomCode(existing);
      expect(code).not.toBeNull();
      expect(existing.has(code)).toBe(false);
    });

    test('returns null when all codes exhausted (simulated)', () => {
      // Create a "full" set that rejects everything
      const mockSet = {
        has: () => true  // Always returns true, so all codes are "taken"
      };
      const code = generateUniqueRoomCode(mockSet, 5);  // Low attempt count
      expect(code).toBeNull();
    });
  });
});
