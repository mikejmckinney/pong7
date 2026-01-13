/**
 * Tests for input validation
 */

const {
  USERNAME,
  ROOM_CODE,
  GAME,
  validateUsername,
  validateRoomCode,
  validateGameMode,
  validateScores,
  validateRally
} = require('./lib/validation');

describe('Validation Module', () => {
  describe('Constants', () => {
    test('USERNAME constraints are correct', () => {
      expect(USERNAME.MIN_LENGTH).toBe(3);
      expect(USERNAME.MAX_LENGTH).toBe(20);
    });

    test('ROOM_CODE constraints are correct', () => {
      expect(ROOM_CODE.LENGTH).toBe(6);
    });

    test('GAME constants are correct', () => {
      expect(GAME.MAX_RALLY_COUNT).toBe(10000);
      expect(GAME.VALID_GAME_MODES).toContain('classic');
      expect(GAME.VALID_GAME_MODES).toContain('chaos');
      expect(GAME.VALID_GAME_MODES).toContain('speedrun');
    });
  });

  describe('validateUsername', () => {
    test('rejects null/undefined', () => {
      expect(validateUsername(null).valid).toBe(false);
      expect(validateUsername(undefined).valid).toBe(false);
      expect(validateUsername('').valid).toBe(false);
    });

    test('rejects non-string input', () => {
      expect(validateUsername(123).valid).toBe(false);
      expect(validateUsername({}).valid).toBe(false);
    });

    test('rejects too short username', () => {
      const result = validateUsername('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3-20');
    });

    test('rejects too long username', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.valid).toBe(false);
    });

    test('rejects invalid characters', () => {
      expect(validateUsername('user name').valid).toBe(false);
      expect(validateUsername('user@name').valid).toBe(false);
      expect(validateUsername('user!').valid).toBe(false);
      expect(validateUsername('用户').valid).toBe(false);
    });

    test('accepts valid usernames', () => {
      expect(validateUsername('player1').valid).toBe(true);
      expect(validateUsername('Player_One').valid).toBe(true);
      expect(validateUsername('test-user').valid).toBe(true);
      expect(validateUsername('ABC123').valid).toBe(true);
    });

    test('trims whitespace', () => {
      const result = validateUsername('  player1  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('player1');
    });
  });

  describe('validateRoomCode', () => {
    test('rejects null/undefined', () => {
      expect(validateRoomCode(null).valid).toBe(false);
      expect(validateRoomCode(undefined).valid).toBe(false);
    });

    test('rejects wrong length', () => {
      expect(validateRoomCode('ABC').valid).toBe(false);
      expect(validateRoomCode('ABCDEFGH').valid).toBe(false);
    });

    test('accepts valid room codes', () => {
      expect(validateRoomCode('ABC123').valid).toBe(true);
      expect(validateRoomCode('abcdef').valid).toBe(true);
    });

    test('normalizes to uppercase', () => {
      const result = validateRoomCode('abc123');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('ABC123');
    });
  });

  describe('validateGameMode', () => {
    test('accepts valid game modes', () => {
      expect(validateGameMode('classic').valid).toBe(true);
      expect(validateGameMode('chaos').valid).toBe(true);
      expect(validateGameMode('speedrun').valid).toBe(true);
    });

    test('defaults to classic when null/undefined', () => {
      expect(validateGameMode(null).mode).toBe('classic');
      expect(validateGameMode(undefined).mode).toBe('classic');
    });

    test('rejects invalid game modes', () => {
      expect(validateGameMode('invalid').valid).toBe(false);
      expect(validateGameMode('CLASSIC').valid).toBe(false);
    });
  });

  describe('validateScores', () => {
    test('rejects non-array', () => {
      expect(validateScores('1,2').valid).toBe(false);
      expect(validateScores({ p1: 1 }).valid).toBe(false);
    });

    test('rejects wrong array length', () => {
      expect(validateScores([1]).valid).toBe(false);
      expect(validateScores([1, 2, 3]).valid).toBe(false);
    });

    test('rejects negative scores', () => {
      expect(validateScores([-1, 0]).valid).toBe(false);
    });

    test('accepts valid scores', () => {
      const result = validateScores([5, 3]);
      expect(result.valid).toBe(true);
      expect(result.scores).toEqual([5, 3]);
    });

    test('validates delta when previous scores provided', () => {
      // Valid: exactly one score increases by 1
      expect(validateScores([1, 0], [0, 0]).valid).toBe(true);
      expect(validateScores([0, 1], [0, 0]).valid).toBe(true);
      
      // Invalid: both scores change
      expect(validateScores([1, 1], [0, 0]).valid).toBe(false);
      
      // Invalid: score jumps by more than 1
      expect(validateScores([2, 0], [0, 0]).valid).toBe(false);
      
      // Invalid: score decreases
      expect(validateScores([0, 0], [1, 0]).valid).toBe(false);
    });
  });

  describe('validateRally', () => {
    test('rejects non-number', () => {
      expect(validateRally('10').valid).toBe(false);
      expect(validateRally(null).valid).toBe(false);
    });

    test('accepts valid rally counts', () => {
      expect(validateRally(10, 0).valid).toBe(true);
      expect(validateRally(0, 0).valid).toBe(true);
    });

    test('rejects rally decrease', () => {
      expect(validateRally(5, 10).valid).toBe(false);
    });

    test('rejects rally above max', () => {
      expect(validateRally(GAME.MAX_RALLY_COUNT + 1, 0).valid).toBe(false);
    });

    test('floors decimal values', () => {
      const result = validateRally(10.7, 0);
      expect(result.valid).toBe(true);
      expect(result.rally).toBe(10);
    });
  });
});
