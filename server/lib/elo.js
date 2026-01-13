/**
 * ELO rating calculation for competitive ranking
 * @module lib/elo
 */

/**
 * K-factor for ELO calculation (higher = more volatile ratings)
 */
const K_FACTOR = 32;

/**
 * Minimum ELO rating a player can have
 */
const MIN_ELO = 100;

/**
 * Default ELO rating for new players
 */
const DEFAULT_ELO = 1000;

/**
 * Calculate ELO rating changes after a match
 * @param {number} winnerRating - Current ELO of winner
 * @param {number} loserRating - Current ELO of loser
 * @returns {{ winnerGain: number, loserLoss: number }} ELO changes
 */
function calculateEloChange(winnerRating, loserRating) {
  // Expected score (probability of winning)
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  
  // Rating changes (zero-sum: winner gains same amount loser loses)
  const change = Math.round(K_FACTOR * (1 - expectedWinner));
  
  return {
    winnerGain: change,
    loserLoss: change
  };
}

/**
 * Apply ELO change to a rating, respecting minimum
 * @param {number} rating - Current rating
 * @param {number} change - Change to apply (positive or negative)
 * @returns {number} New rating
 */
function applyEloChange(rating, change) {
  return Math.max(MIN_ELO, rating + change);
}

module.exports = {
  K_FACTOR,
  MIN_ELO,
  DEFAULT_ELO,
  calculateEloChange,
  applyEloChange
};
