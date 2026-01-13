/**
 * Storage module for Pong game
 * Handles localStorage for settings and local stats
 */

const Storage = {
  KEYS: {
    STATS: 'pongStats',
    SETTINGS: 'pongSettings',
    USERNAME: 'pongUsername'
  },

  /**
   * Save local game stats
   * @param {Object} stats - Stats object to save
   */
  saveLocalStats(stats) {
    try {
      localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  },

  /**
   * Get local game stats
   * @returns {Object} Stats object
   */
  getLocalStats() {
    try {
      const data = localStorage.getItem(this.KEYS.STATS);
      return data ? JSON.parse(data) : this.getDefaultStats();
    } catch (e) {
      console.warn('Failed to load stats:', e);
      return this.getDefaultStats();
    }
  },

  /**
   * Get default stats object
   * @returns {Object} Default stats
   */
  getDefaultStats() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalPointsScored: 0,
      totalPointsAgainst: 0,
      highestScore: 0,
      longestWinStreak: 0,
      currentWinStreak: 0,
      lastPlayed: null
    };
  },

  /**
   * Update stats after a game
   * @param {boolean} won - True if player won
   * @param {number} playerScore - Player's score
   * @param {number} opponentScore - Opponent's score
   */
  updateStats(won, playerScore, opponentScore) {
    const stats = this.getLocalStats();

    stats.gamesPlayed++;
    stats.totalPointsScored += playerScore;
    stats.totalPointsAgainst += opponentScore;
    stats.lastPlayed = new Date().toISOString();

    if (won) {
      stats.gamesWon++;
      stats.currentWinStreak++;
      if (stats.currentWinStreak > stats.longestWinStreak) {
        stats.longestWinStreak = stats.currentWinStreak;
      }
    } else {
      stats.gamesLost++;
      stats.currentWinStreak = 0;
    }

    if (playerScore > stats.highestScore) {
      stats.highestScore = playerScore;
    }

    this.saveLocalStats(stats);
    return stats;
  },

  /**
   * Save game settings
   * @param {Object} settings - Settings object
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  },

  /**
   * Get game settings
   * @returns {Object} Settings object
   */
  getSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch (e) {
      console.warn('Failed to load settings:', e);
      return this.getDefaultSettings();
    }
  },

  /**
   * Get default settings object
   * @returns {Object} Default settings
   */
  getDefaultSettings() {
    return {
      soundEnabled: true,
      musicEnabled: true,
      masterVolume: 0.5,
      sfxVolume: 0.7,
      musicVolume: 0.3,
      hapticEnabled: true,
      particlesEnabled: true,
      scanlinesEnabled: false,
      lowPowerMode: false,
      controlSensitivity: 1.0,
      invertControls: false,
      difficulty: 'medium'
    };
  },

  /**
   * Update a single setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
    return settings;
  },

  /**
   * Save username
   * @param {string} username - Username to save
   */
  saveUsername(username) {
    try {
      localStorage.setItem(this.KEYS.USERNAME, username);
    } catch (e) {
      console.warn('Failed to save username:', e);
    }
  },

  /**
   * Get saved username or generate new one
   * @returns {string} Username
   */
  getUsername() {
    try {
      const username = localStorage.getItem(this.KEYS.USERNAME);
      if (username) {
        return username;
      }
      // Generate and save new username
      const newUsername = Utils.generateUsername();
      this.saveUsername(newUsername);
      return newUsername;
    } catch (e) {
      return Utils.generateUsername();
    }
  },

  /**
   * Clear all stored data
   */
  clearAll() {
    try {
      localStorage.removeItem(this.KEYS.STATS);
      localStorage.removeItem(this.KEYS.SETTINGS);
      localStorage.removeItem(this.KEYS.USERNAME);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }
};

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
