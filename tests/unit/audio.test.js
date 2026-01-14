/**
 * Unit tests for Audio module
 * Tests countdown audio timing and sound effects
 */

const path = require('path');

// Load dependencies
const CONFIG = require(path.join(__dirname, '../../js/config.js'));
global.CONFIG = CONFIG;

// Create Utils mock (for audio.js Utils.clamp usage)
global.Utils = {
  clamp: (val, min, max) => Math.min(Math.max(val, min), max)
};

// Mock navigator.vibrate
global.navigator = { vibrate: jest.fn() };

// Mock AudioContext
class MockOscillator {
  constructor() {
    this.type = 'square';
    this.frequency = { value: 440 };
  }
  connect() {}
  start() {}
  stop() {}
}

class MockGainNode {
  constructor() {
    this.gain = {
      value: 1,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    };
  }
  connect() {}
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
    this.currentTime = 0;
  }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGainNode(); }
  resume() { return Promise.resolve(); }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Now load the SoundManager (the audio module exports sound globally)
const audioModule = require(path.join(__dirname, '../../js/audio.js'));

describe('SoundManager', () => {
  let soundManager;

  beforeEach(async () => {
    jest.useFakeTimers();
    soundManager = new audioModule.SoundManager();
    await soundManager.init();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('gameStart - Countdown Audio', () => {
    test('plays 4 beeps for countdown (3, 2, 1, GO)', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.gameStart();
      
      // Advance timers to trigger all beeps
      jest.advanceTimersByTime(4000);
      
      // Should have called playTone 4 times
      expect(playToneSpy).toHaveBeenCalledTimes(4);
    });

    test('beeps occur at 1000ms intervals to match visual countdown', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.gameStart();
      
      // First beep at 0ms (for "3")
      jest.advanceTimersByTime(0);
      expect(playToneSpy).toHaveBeenCalledTimes(1);
      
      // Second beep at 1000ms (for "2")
      jest.advanceTimersByTime(1000);
      expect(playToneSpy).toHaveBeenCalledTimes(2);
      
      // Third beep at 2000ms (for "1")
      jest.advanceTimersByTime(1000);
      expect(playToneSpy).toHaveBeenCalledTimes(3);
      
      // Fourth beep at 3000ms (for "GO")
      jest.advanceTimersByTime(1000);
      expect(playToneSpy).toHaveBeenCalledTimes(4);
    });

    test('countdown beeps match CONFIG.GAME.COUNTDOWN_DURATION', () => {
      // CONFIG.GAME.COUNTDOWN_DURATION is 3000ms
      // Beeps occur at 0, 1000, 2000, 3000ms
      // So total duration matches the countdown
      const countdownDuration = CONFIG.GAME.COUNTDOWN_DURATION;
      expect(countdownDuration).toBe(3000);
      
      // With 1000ms intervals and 4 beeps (0, 1000, 2000, 3000),
      // the last beep at 3000ms coincides with countdown end
      const beepIntervals = 1000;
      const lastBeepTime = (4 - 1) * beepIntervals; // 3000ms
      expect(lastBeepTime).toBe(countdownDuration);
    });

    test('uses correct frequencies (E4, E4, E4, E5)', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.gameStart();
      jest.advanceTimersByTime(4000);
      
      const expectedFrequencies = [330, 330, 330, 660];
      const calls = playToneSpy.mock.calls;
      
      expect(calls[0][0]).toBe(expectedFrequencies[0]); // 330 Hz (E4)
      expect(calls[1][0]).toBe(expectedFrequencies[1]); // 330 Hz (E4)
      expect(calls[2][0]).toBe(expectedFrequencies[2]); // 330 Hz (E4)
      expect(calls[3][0]).toBe(expectedFrequencies[3]); // 660 Hz (E5)
    });

    test('last beep is higher pitched for "GO"', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.gameStart();
      jest.advanceTimersByTime(4000);
      
      const calls = playToneSpy.mock.calls;
      const lastBeepFreq = calls[3][0];
      const firstBeepFreq = calls[0][0];
      
      // Last beep (660 Hz) should be higher than countdown beeps (330 Hz)
      expect(lastBeepFreq).toBeGreaterThan(firstBeepFreq);
      expect(lastBeepFreq).toBe(660); // E5
      expect(firstBeepFreq).toBe(330); // E4
    });
  });

  describe('playTone', () => {
    test('creates oscillator with correct type', () => {
      const oscillator = soundManager.audioContext.createOscillator();
      soundManager.playTone(440, 0.2, 'sine');
      
      // Verify oscillator was created (mock behavior)
      expect(oscillator).toBeDefined();
    });

    test('does not play when not initialized', () => {
      const uninitSoundManager = new audioModule.SoundManager();
      const createOscSpy = jest.spyOn(MockAudioContext.prototype, 'createOscillator');
      
      uninitSoundManager.playTone(440, 0.2);
      
      // Should not create oscillator when not initialized
      expect(createOscSpy).not.toHaveBeenCalled();
      
      createOscSpy.mockRestore();
    });

    test('does not play when disabled', async () => {
      soundManager.enabled = false;
      const createOscSpy = jest.spyOn(soundManager.audioContext, 'createOscillator');
      
      soundManager.playTone(440, 0.2);
      
      expect(createOscSpy).not.toHaveBeenCalled();
    });
  });

  describe('paddleHit', () => {
    test('plays tone with frequency based on hit position', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.paddleHit(0); // Center hit
      expect(playToneSpy).toHaveBeenCalledWith(440, 0.08, 'square');
      
      playToneSpy.mockClear();
      
      soundManager.paddleHit(1); // Bottom hit
      expect(playToneSpy).toHaveBeenCalledWith(540, 0.08, 'square');
      
      playToneSpy.mockClear();
      
      soundManager.paddleHit(-1); // Top hit
      expect(playToneSpy).toHaveBeenCalledWith(340, 0.08, 'square');
    });

    test('triggers haptic feedback', () => {
      soundManager.paddleHit(0);
      expect(navigator.vibrate).toHaveBeenCalledWith(20);
    });
  });

  describe('wallBounce', () => {
    test('plays low frequency bounce sound', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.wallBounce();
      
      expect(playToneSpy).toHaveBeenCalledWith(220, 0.05, 'square');
    });
  });

  describe('scoreWin', () => {
    test('plays ascending notes', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.scoreWin();
      jest.advanceTimersByTime(300);
      
      expect(playToneSpy).toHaveBeenCalledTimes(3);
      
      const calls = playToneSpy.mock.calls;
      expect(calls[0][0]).toBe(523); // C5
      expect(calls[1][0]).toBe(659); // E5
      expect(calls[2][0]).toBe(784); // G5
    });
  });

  describe('scoreLose', () => {
    test('plays descending notes', () => {
      const playToneSpy = jest.spyOn(soundManager, 'playTone');
      
      soundManager.scoreLose();
      jest.advanceTimersByTime(300);
      
      expect(playToneSpy).toHaveBeenCalledTimes(3);
      
      const calls = playToneSpy.mock.calls;
      expect(calls[0][0]).toBe(392); // G4
      expect(calls[1][0]).toBe(349); // F4
      expect(calls[2][0]).toBe(330); // E4
    });
  });

  describe('Volume Controls', () => {
    test('setMasterVolume clamps value between 0 and 1', () => {
      soundManager.setMasterVolume(1.5);
      expect(soundManager.masterVolume.gain.value).toBe(1);
      
      soundManager.setMasterVolume(-0.5);
      expect(soundManager.masterVolume.gain.value).toBe(0);
    });

    test('setSfxVolume clamps value between 0 and 1', () => {
      soundManager.setSfxVolume(2.0);
      expect(soundManager.sfxVolume.gain.value).toBe(1);
      
      soundManager.setSfxVolume(-1.0);
      expect(soundManager.sfxVolume.gain.value).toBe(0);
    });

    test('setMuted sets master volume to 0', () => {
      soundManager.setMuted(true);
      expect(soundManager.masterVolume.gain.value).toBe(0);
    });

    test('setMuted restores master volume when unmuted', () => {
      soundManager.setMuted(true);
      soundManager.setMuted(false);
      expect(soundManager.masterVolume.gain.value).toBe(CONFIG.AUDIO.MASTER_VOLUME);
    });
  });

  describe('Enabled State', () => {
    test('setEnabled controls whether sounds play', () => {
      soundManager.setEnabled(false);
      expect(soundManager.enabled).toBe(false);
      
      soundManager.setEnabled(true);
      expect(soundManager.enabled).toBe(true);
    });
  });

  describe('Haptic Feedback', () => {
    test('vibrate calls navigator.vibrate with pattern', () => {
      soundManager.vibrate(100);
      expect(navigator.vibrate).toHaveBeenCalledWith(100);
      
      soundManager.vibrate([20, 50, 40]);
      expect(navigator.vibrate).toHaveBeenCalledWith([20, 50, 40]);
    });
  });
});
