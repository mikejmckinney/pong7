/**
 * Unit tests for Storage module
 */

const path = require('path');

// Load the Utils module first (Storage depends on it)
const Utils = require(path.join(__dirname, '../../js/utils.js'));
global.Utils = Utils;

// Load the Storage module
const Storage = require(path.join(__dirname, '../../js/storage.js'));

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDefaultStats', () => {
    test('returns default stats object', () => {
      const stats = Storage.getDefaultStats();
      
      expect(stats.gamesPlayed).toBe(0);
      expect(stats.gamesWon).toBe(0);
      expect(stats.gamesLost).toBe(0);
      expect(stats.highestScore).toBe(0);
    });
  });

  describe('saveLocalStats / getLocalStats', () => {
    test('persists and retrieves stats', () => {
      const stats = {
        gamesPlayed: 10,
        gamesWon: 7,
        highestScore: 11
      };
      
      Storage.saveLocalStats(stats);
      const retrieved = Storage.getLocalStats();
      
      expect(retrieved.gamesPlayed).toBe(10);
      expect(retrieved.gamesWon).toBe(7);
      expect(retrieved.highestScore).toBe(11);
    });

    test('returns default stats when none saved', () => {
      const stats = Storage.getLocalStats();
      expect(stats.gamesPlayed).toBe(0);
    });
  });

  describe('updateStats', () => {
    test('increments games played on win', () => {
      const stats = Storage.updateStats(true, 11, 5);
      
      expect(stats.gamesPlayed).toBe(1);
      expect(stats.gamesWon).toBe(1);
      expect(stats.gamesLost).toBe(0);
    });

    test('increments games played on loss', () => {
      const stats = Storage.updateStats(false, 5, 11);
      
      expect(stats.gamesPlayed).toBe(1);
      expect(stats.gamesWon).toBe(0);
      expect(stats.gamesLost).toBe(1);
    });

    test('tracks win streak', () => {
      Storage.updateStats(true, 11, 5);
      Storage.updateStats(true, 11, 6);
      const stats = Storage.updateStats(true, 11, 7);
      
      expect(stats.currentWinStreak).toBe(3);
      expect(stats.longestWinStreak).toBe(3);
    });

    test('resets win streak on loss', () => {
      Storage.updateStats(true, 11, 5);
      Storage.updateStats(true, 11, 6);
      const stats = Storage.updateStats(false, 5, 11);
      
      expect(stats.currentWinStreak).toBe(0);
      expect(stats.longestWinStreak).toBe(2);
    });

    test('tracks highest score', () => {
      Storage.updateStats(true, 11, 5);
      Storage.updateStats(true, 15, 10);
      const stats = Storage.updateStats(true, 11, 8);
      
      expect(stats.highestScore).toBe(15);
    });
  });

  describe('getDefaultSettings', () => {
    test('returns default settings object', () => {
      const settings = Storage.getDefaultSettings();
      
      expect(settings.soundEnabled).toBe(true);
      expect(settings.difficulty).toBe('medium');
      expect(settings.controlSensitivity).toBe(1.0);
    });
  });

  describe('saveSettings / getSettings', () => {
    test('persists and retrieves settings', () => {
      const settings = {
        soundEnabled: false,
        difficulty: 'hard',
        controlSensitivity: 1.5
      };
      
      Storage.saveSettings(settings);
      const retrieved = Storage.getSettings();
      
      expect(retrieved.soundEnabled).toBe(false);
      expect(retrieved.difficulty).toBe('hard');
      expect(retrieved.controlSensitivity).toBe(1.5);
    });
  });

  describe('updateSetting', () => {
    test('updates a single setting', () => {
      Storage.updateSetting('difficulty', 'impossible');
      const settings = Storage.getSettings();
      
      expect(settings.difficulty).toBe('impossible');
    });
  });

  describe('getUsername', () => {
    test('generates username if none saved', () => {
      const username = Storage.getUsername();
      expect(username.startsWith('Player')).toBe(true);
    });

    test('returns saved username', () => {
      Storage.saveUsername('TestPlayer');
      const username = Storage.getUsername();
      expect(username).toBe('TestPlayer');
    });
  });

  describe('clearAll', () => {
    test('clears all stored data', () => {
      Storage.saveLocalStats({ gamesPlayed: 10 });
      Storage.saveSettings({ difficulty: 'hard' });
      Storage.saveUsername('TestPlayer');
      
      Storage.clearAll();
      
      const stats = Storage.getLocalStats();
      const settings = Storage.getSettings();
      
      expect(stats.gamesPlayed).toBe(0);
      expect(settings.difficulty).toBe('medium');
    });
  });
});
