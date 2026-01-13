/**
 * Tests for ELO rating calculation
 */

const { 
  K_FACTOR, 
  MIN_ELO, 
  DEFAULT_ELO, 
  calculateEloChange, 
  applyEloChange 
} = require('./lib/elo');

describe('ELO Module', () => {
  describe('Constants', () => {
    test('K_FACTOR is 32', () => {
      expect(K_FACTOR).toBe(32);
    });

    test('MIN_ELO is 100', () => {
      expect(MIN_ELO).toBe(100);
    });

    test('DEFAULT_ELO is 1000', () => {
      expect(DEFAULT_ELO).toBe(1000);
    });
  });

  describe('calculateEloChange', () => {
    test('higher rated player beating lower rated gains fewer points', () => {
      const result = calculateEloChange(1200, 1000);
      expect(result.winnerGain).toBeLessThan(16); // Less than half K-factor
      expect(result.loserLoss).toBe(result.winnerGain);
    });

    test('lower rated player beating higher rated gains more points', () => {
      const result = calculateEloChange(1000, 1200);
      expect(result.winnerGain).toBeGreaterThan(16); // More than half K-factor
    });

    test('equal rated players split K-factor', () => {
      const result = calculateEloChange(1000, 1000);
      expect(result.winnerGain).toBe(16); // Exactly half of K=32
    });

    test('returns zero-sum (winnerGain equals loserLoss)', () => {
      const result = calculateEloChange(1100, 900);
      expect(result.winnerGain).toBe(result.loserLoss);
    });

    test('returns integer values', () => {
      const result = calculateEloChange(1234, 987);
      expect(Number.isInteger(result.winnerGain)).toBe(true);
      expect(Number.isInteger(result.loserLoss)).toBe(true);
    });
  });

  describe('applyEloChange', () => {
    test('adds positive change to rating', () => {
      expect(applyEloChange(1000, 20)).toBe(1020);
    });

    test('subtracts negative change from rating', () => {
      expect(applyEloChange(1000, -20)).toBe(980);
    });

    test('does not go below MIN_ELO', () => {
      expect(applyEloChange(150, -100)).toBe(MIN_ELO);
      expect(applyEloChange(50, -10)).toBe(MIN_ELO);
    });

    test('handles zero change', () => {
      expect(applyEloChange(1000, 0)).toBe(1000);
    });
  });
});
