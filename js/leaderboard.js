/**
 * Leaderboard Module
 * Handles fetching and displaying global leaderboard data from Supabase
 */

const Leaderboard = {
  supabase: null,
  isInitialized: false,
  
  /**
   * Initialize Supabase client for leaderboard queries
   * Uses the anon/public key which only allows read access
   */
  init() {
    // Check if Supabase client is available from CDN
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      try {
        this.supabase = window.supabase.createClient(
          CONFIG.SUPABASE_URL,
          CONFIG.SUPABASE_ANON_KEY
        );
        this.isInitialized = true;
        console.log('Leaderboard: Supabase client initialized');
      } catch (err) {
        console.warn('Leaderboard: Failed to initialize Supabase client:', err.message);
        this.isInitialized = false;
      }
    } else {
      console.warn('Leaderboard: Supabase client not available');
      this.isInitialized = false;
    }
    return this.isInitialized;
  },
  
  /**
   * Fetch the global leaderboard (top 100 players)
   * @param {number} [limit=100] - Maximum number of players to fetch
   * @returns {Promise<Array>} Array of player leaderboard entries
   */
  async getGlobalLeaderboard(limit = 100) {
    if (!this.isInitialized) {
      if (!this.init()) {
        return { data: null, error: 'Supabase not available' };
      }
    }
    
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('*')
        .order('elo_rating', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Leaderboard: Error fetching global leaderboard:', error.message);
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Leaderboard: Exception fetching leaderboard:', err.message);
      return { data: null, error: err.message };
    }
  },
  
  /**
   * Get a specific player's stats from the leaderboard
   * @param {string} username - Player username to look up
   * @returns {Promise<Object>} Player stats or error
   */
  async getPlayerStats(username) {
    if (!this.isInitialized) {
      if (!this.init()) {
        return { data: null, error: 'Supabase not available' };
      }
    }
    
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        // PGRST116 is "no rows returned" which isn't really an error
        if (error.code === 'PGRST116') {
          return { data: null, error: null };
        }
        console.error('Leaderboard: Error fetching player stats:', error.message);
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Leaderboard: Exception fetching player stats:', err.message);
      return { data: null, error: err.message };
    }
  },
  
  /**
   * Format a leaderboard entry for display
   * @param {Object} entry - Leaderboard entry from Supabase
   * @param {number} rank - Player's rank (1-indexed)
   * @returns {Object} Formatted entry for display
   */
  formatEntry(entry, rank) {
    return {
      rank,
      username: entry.username || 'Unknown',
      displayName: entry.display_name || entry.username || 'Unknown',
      elo: entry.elo_rating || 1000,
      gamesPlayed: entry.games_played || 0,
      gamesWon: entry.games_won || 0,
      winPercentage: entry.win_percentage || 0,
      bestStreak: entry.best_win_streak || 0
    };
  },
  
  /**
   * Check if online leaderboard is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.isInitialized || this.init();
  }
};

// Export for Node.js/testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Leaderboard;
}
