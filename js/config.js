/**
 * Game configuration constants
 * Contains all configurable game parameters and environment settings
 */

const CONFIG = {
  // Backend URL - auto-detect based on environment
  // Production backend on Render
  BACKEND_URL: (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:3001'
    : 'https://pong7.onrender.com',
  
  // Supabase configuration (for direct leaderboard queries)
  SUPABASE_URL: 'https://sjeyisealyvavzjrdcgf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZXlpc2VhbHl2YXZ6anJkY2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDIyNTQsImV4cCI6MjA4MzkxODI1NH0.yYOJKe2wfj6vt1Jjl-HpiF8_B4q4b5OgPOA9BW03QBI',

  // Game Settings
  GAME: {
    WIN_SCORE: 11,
    BALL_SPEED: 5,
    BALL_SPEED_INCREMENT: 0.2,
    PADDLE_SPEED: 8,
    PADDLE_WIDTH: 10,
    PADDLE_HEIGHT: 80,
    BALL_RADIUS: 8,
    POWERUP_INTERVAL: 12000,
    POWERUP_VARIANCE: 3000,
    SCORE_PAUSE_DURATION: 1500,
    COUNTDOWN_DURATION: 3000
  },

  // AI Settings
  AI: {
    EASY: {
      reactionDelay: 300,
      mistakeChance: 0.20,
      maxSpeedMultiplier: 0.60,
      predictionError: 50
    },
    MEDIUM: {
      reactionDelay: 150,
      mistakeChance: 0.05,
      maxSpeedMultiplier: 0.80,
      predictionError: 25
    },
    HARD: {
      reactionDelay: 50,
      mistakeChance: 0,
      maxSpeedMultiplier: 1.0,
      predictionError: 10
    },
    IMPOSSIBLE: {
      reactionDelay: 0,
      mistakeChance: 0,
      maxSpeedMultiplier: 1.0,
      predictionError: 0
    }
  },

  // Canvas Settings
  CANVAS: {
    ASPECT_RATIO: 4 / 3,
    MIN_WIDTH: 320,
    MAX_WIDTH: 1920
  },

  // Audio Settings
  AUDIO: {
    MASTER_VOLUME: 0.5,
    SFX_VOLUME: 0.7,
    MUSIC_VOLUME: 0.3
  },

  // Visual Settings
  VISUALS: {
    TRAIL_LENGTH: 10,
    PARTICLE_COUNT: 20,
    GLOW_INTENSITY: 20
  }
};

// Freeze config to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.GAME);
Object.freeze(CONFIG.AI);
Object.freeze(CONFIG.CANVAS);
Object.freeze(CONFIG.AUDIO);
Object.freeze(CONFIG.VISUALS);

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
