/**
 * Input validation utilities
 * @module lib/validation
 */

/**
 * Username constraints
 */
const USERNAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9_-]+$/
};

/**
 * Room code constraints
 */
const ROOM_CODE = {
  LENGTH: 6,
  CHARACTERS: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
};

/**
 * Game constants for validation
 */
const GAME = {
  MAX_RALLY_COUNT: 10000,
  VALID_GAME_MODES: ['classic', 'chaos', 'speedrun']
};

/**
 * Validate and sanitize a username
 * @param {*} username - Input to validate
 * @returns {{ valid: boolean, error?: string, sanitized?: string }}
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  const sanitized = username.trim();
  const length = sanitized.length;
  
  if (length < USERNAME.MIN_LENGTH || length > USERNAME.MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Username must be ${USERNAME.MIN_LENGTH}-${USERNAME.MAX_LENGTH} characters` 
    };
  }
  
  if (!USERNAME.PATTERN.test(sanitized)) {
    return { 
      valid: false, 
      error: 'Username can only contain letters, numbers, underscores, and hyphens' 
    };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate a room code
 * @param {*} roomCode - Input to validate
 * @returns {{ valid: boolean, error?: string, normalized?: string }}
 */
function validateRoomCode(roomCode) {
  if (!roomCode || typeof roomCode !== 'string') {
    return { valid: false, error: 'Room code is required' };
  }
  
  const normalized = roomCode.trim().toUpperCase();
  
  if (normalized.length !== ROOM_CODE.LENGTH) {
    return { valid: false, error: `Room code must be ${ROOM_CODE.LENGTH} characters` };
  }
  
  // Check all characters are valid
  for (const char of normalized) {
    if (!ROOM_CODE.CHARACTERS.includes(char)) {
      return { valid: false, error: 'Invalid room code format' };
    }
  }
  
  return { valid: true, normalized };
}

/**
 * Validate a game mode
 * @param {*} gameMode - Input to validate
 * @returns {{ valid: boolean, error?: string, mode?: string }}
 */
function validateGameMode(gameMode) {
  const mode = gameMode || 'classic';
  
  if (typeof mode !== 'string') {
    return { valid: false, error: 'Invalid game mode' };
  }
  
  if (!GAME.VALID_GAME_MODES.includes(mode)) {
    return { valid: false, error: 'Invalid game mode' };
  }
  
  return { valid: true, mode };
}

/**
 * Validate scores array
 * @param {*} scores - Input to validate
 * @param {number[]} [previousScores] - Optional previous scores for delta validation
 * @returns {{ valid: boolean, error?: string, scores?: number[] }}
 */
function validateScores(scores, previousScores = null) {
  if (!Array.isArray(scores) || scores.length !== 2) {
    return { valid: false, error: 'Invalid scores format' };
  }
  
  const validatedScores = scores.map(s => {
    const num = Number(s);
    return Number.isInteger(num) && num >= 0 ? num : NaN;
  });
  
  if (validatedScores.some(isNaN)) {
    return { valid: false, error: 'Scores must be non-negative integers' };
  }
  
  // Delta validation if previous scores provided
  if (previousScores !== null) {
    const delta0 = validatedScores[0] - previousScores[0];
    const delta1 = validatedScores[1] - previousScores[1];
    
    // In pong, only one player scores per rally (exactly one +1, other unchanged)
    const validDelta = (delta0 === 1 && delta1 === 0) || (delta0 === 0 && delta1 === 1);
    
    if (!validDelta) {
      return { valid: false, error: 'Invalid score delta' };
    }
  }
  
  return { valid: true, scores: validatedScores };
}

/**
 * Validate rally count
 * @param {*} rally - Input to validate
 * @param {number} [previousRally] - Previous rally count for comparison
 * @returns {{ valid: boolean, rally?: number }}
 */
function validateRally(rally, previousRally = 0) {
  if (typeof rally !== 'number') {
    return { valid: false };
  }
  
  const clampedRally = Math.max(0, Math.floor(rally));
  
  // Rally should only increase and be within reasonable bounds
  if (clampedRally < previousRally || clampedRally > GAME.MAX_RALLY_COUNT) {
    return { valid: false };
  }
  
  return { valid: true, rally: clampedRally };
}

module.exports = {
  USERNAME,
  ROOM_CODE,
  GAME,
  validateUsername,
  validateRoomCode,
  validateGameMode,
  validateScores,
  validateRally
};
