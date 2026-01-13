/**
 * Room code generation utility
 * @module lib/roomCode
 */

const { ROOM_CODE } = require('./validation');

/**
 * Generate a random room code
 * Room codes are 6 uppercase alphanumeric characters
 * @returns {string} Room code
 */
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE.LENGTH; i++) {
    const index = Math.floor(Math.random() * ROOM_CODE.CHARACTERS.length);
    code += ROOM_CODE.CHARACTERS[index];
  }
  return code;
}

/**
 * Generate a unique room code that doesn't exist in the given set
 * @param {Set<string>|Map<string, *>} existingCodes - Set or Map of existing codes
 * @param {number} [maxAttempts=100] - Maximum generation attempts
 * @returns {string|null} Unique room code or null if failed
 */
function generateUniqueRoomCode(existingCodes, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateRoomCode();
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return null;
}

module.exports = {
  generateRoomCode,
  generateUniqueRoomCode
};
