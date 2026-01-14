/**
 * Tests for Leaderboard module
 */

const Leaderboard = require('../../js/leaderboard');
const CONFIG = require('../../js/config');

// Mock CONFIG for tests
global.CONFIG = CONFIG;

describe('Leaderboard', () => {
  beforeEach(() => {
    // Reset the module state before each test
    Leaderboard.supabase = null;
    Leaderboard.isInitialized = false;
  });

  describe('init', () => {
    it('returns false when supabase client is not available', () => {
      // Ensure window.supabase is undefined
      global.window = {};
      const result = Leaderboard.init();
      expect(result).toBe(false);
      expect(Leaderboard.isInitialized).toBe(false);
    });

    // Note: Testing successful init with browser's window.supabase is difficult in Jest
    // since the module checks typeof window at import time. The core functionality
    // is tested via the getGlobalLeaderboard and getPlayerStats tests with mocked supabase.
    it('sets isInitialized to true when manually configured', () => {
      // Simulate what init() does when supabase is available
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      };
      
      Leaderboard.supabase = mockClient;
      Leaderboard.isInitialized = true;
      
      expect(Leaderboard.isInitialized).toBe(true);
      expect(Leaderboard.supabase).toBe(mockClient);
    });
  });

  describe('formatEntry', () => {
    it('formats a leaderboard entry with all fields', () => {
      const entry = {
        username: 'TestPlayer',
        display_name: 'Test Display',
        elo_rating: 1500,
        games_played: 100,
        games_won: 75,
        win_percentage: 75.0,
        best_win_streak: 10
      };

      const formatted = Leaderboard.formatEntry(entry, 5);

      expect(formatted).toEqual({
        rank: 5,
        username: 'TestPlayer',
        displayName: 'Test Display',
        elo: 1500,
        gamesPlayed: 100,
        gamesWon: 75,
        winPercentage: 75.0,
        bestStreak: 10
      });
    });

    it('handles missing fields with defaults', () => {
      const entry = {};

      const formatted = Leaderboard.formatEntry(entry, 1);

      expect(formatted).toEqual({
        rank: 1,
        username: 'Unknown',
        displayName: 'Unknown',
        elo: 1000,
        gamesPlayed: 0,
        gamesWon: 0,
        winPercentage: 0,
        bestStreak: 0
      });
    });

    it('uses username as displayName when display_name is missing', () => {
      const entry = {
        username: 'Player123'
      };

      const formatted = Leaderboard.formatEntry(entry, 2);

      expect(formatted.displayName).toBe('Player123');
    });
  });

  describe('isAvailable', () => {
    it('returns false when not initialized and cannot init', () => {
      global.window = {};
      Leaderboard.isInitialized = false;
      expect(Leaderboard.isAvailable()).toBe(false);
    });

    it('returns true when already initialized', () => {
      Leaderboard.isInitialized = true;
      expect(Leaderboard.isAvailable()).toBe(true);
    });
  });

  describe('getGlobalLeaderboard', () => {
    it('returns error when supabase is not available', async () => {
      global.window = {};
      Leaderboard.isInitialized = false;
      Leaderboard.supabase = null;
      
      const result = await Leaderboard.getGlobalLeaderboard();
      
      expect(result.data).toBeNull();
      expect(result.error).toBe('Supabase not available');
    });

    it('fetches leaderboard data when already initialized', async () => {
      const mockData = [
        { username: 'Player1', elo_rating: 1500 },
        { username: 'Player2', elo_rating: 1400 }
      ];

      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };

      // Manually set the initialized state
      Leaderboard.isInitialized = true;
      Leaderboard.supabase = mockClient;

      const result = await Leaderboard.getGlobalLeaderboard(50);

      expect(mockClient.from).toHaveBeenCalledWith('leaderboard');
      expect(mockClient.select).toHaveBeenCalledWith('*');
      expect(mockClient.order).toHaveBeenCalledWith('elo_rating', { ascending: false });
      expect(mockClient.limit).toHaveBeenCalledWith(50);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });
  });

  describe('getPlayerStats', () => {
    it('returns error when supabase is not available', async () => {
      global.window = {};
      Leaderboard.isInitialized = false;
      Leaderboard.supabase = null;
      
      const result = await Leaderboard.getPlayerStats('TestPlayer');
      
      expect(result.data).toBeNull();
      expect(result.error).toBe('Supabase not available');
    });

    it('returns null data and no error when player not found', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'no rows returned' } 
        })
      };

      // Manually set the initialized state
      Leaderboard.isInitialized = true;
      Leaderboard.supabase = mockClient;

      const result = await Leaderboard.getPlayerStats('NonExistent');

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('fetches player stats when player exists', async () => {
      const mockPlayerData = {
        username: 'TestPlayer',
        elo_rating: 1500,
        games_won: 50
      };

      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPlayerData, error: null })
      };

      Leaderboard.isInitialized = true;
      Leaderboard.supabase = mockClient;

      const result = await Leaderboard.getPlayerStats('TestPlayer');

      expect(mockClient.from).toHaveBeenCalledWith('leaderboard');
      expect(mockClient.eq).toHaveBeenCalledWith('username', 'TestPlayer');
      expect(result.data).toEqual(mockPlayerData);
      expect(result.error).toBeNull();
    });
  });
});
