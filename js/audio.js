/**
 * Audio module for Pong game
 * Implements Web Audio API for programmatic sound generation
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.masterVolume = null;
    this.sfxVolume = null;
    this.enabled = true;
    this.initialized = false;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create gain nodes for volume control
      this.masterVolume = this.audioContext.createGain();
      this.masterVolume.connect(this.audioContext.destination);
      this.masterVolume.gain.value = CONFIG.AUDIO.MASTER_VOLUME;

      this.sfxVolume = this.audioContext.createGain();
      this.sfxVolume.connect(this.masterVolume);
      this.sfxVolume.gain.value = CONFIG.AUDIO.SFX_VOLUME;

      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Resume audio context if suspended (required after user interaction on mobile)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a tone with specified parameters
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} type - Oscillator type ('sine', 'square', 'sawtooth', 'triangle')
   * @param {number} volume - Volume multiplier (0-1)
   */
  playTone(frequency, duration, type = 'square', volume = 0.3) {
    if (!this.enabled || !this.initialized || !this.audioContext) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxVolume);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play paddle hit sound
   * @param {number} hitPosition - Position on paddle (-1 to 1)
   */
  paddleHit(hitPosition = 0) {
    const baseFreq = 440;
    const freq = baseFreq + (hitPosition * 100); // 340-540 Hz range
    this.playTone(freq, 0.08, 'square');

    // Haptic feedback
    this.vibrate(20);
  }

  /**
   * Play wall bounce sound
   */
  wallBounce() {
    this.playTone(220, 0.05, 'square');
  }

  /**
   * Play score win sound (ascending)
   */
  scoreWin() {
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'square'), i * 100);
    });

    // Haptic feedback
    this.vibrate([20, 50, 40]);
  }

  /**
   * Play score lose sound (descending)
   */
  scoreLose() {
    const notes = [392, 349, 330]; // G4, F4, E4
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sawtooth'), i * 80);
    });

    // Haptic feedback
    this.vibrate([20, 50, 40]);
  }

  /**
   * Play game start countdown
   */
  gameStart() {
    const beeps = [330, 330, 330, 660]; // E4, E4, E4, E5
    beeps.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square'), i * 400);
    });
  }

  /**
   * Play game over/victory fanfare
   */
  gameOver() {
    const melody = [523, 523, 523, 659, 784, 659, 784];
    const durations = [0.1, 0.1, 0.1, 0.15, 0.3, 0.15, 0.5];
    let time = 0;

    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, durations[i], 'square'), time);
      time += durations[i] * 1000 + 50;
    });

    // Haptic feedback
    this.vibrate(100);
  }

  /**
   * Play power-up spawn sound (shimmer)
   */
  powerUpSpawn() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(800 + i * 200, 0.05, 'sine');
      }, i * 50);
    }
  }

  /**
   * Play power-up collect sound
   */
  powerUpCollect() {
    this.playTone(880, 0.05, 'square');
    setTimeout(() => this.playTone(1108, 0.1, 'square'), 50);
  }

  /**
   * Play menu select sound
   */
  menuSelect() {
    this.playTone(660, 0.05, 'square');
  }

  /**
   * Play menu back sound
   */
  menuBack() {
    this.playTone(440, 0.05, 'square');
  }

  /**
   * Trigger haptic feedback (vibration)
   * @param {number|number[]} pattern - Vibration pattern in milliseconds
   */
  vibrate(pattern) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Set master volume
   * @param {number} value - Volume level (0-1)
   */
  setMasterVolume(value) {
    if (this.masterVolume) {
      this.masterVolume.gain.value = Utils.clamp(value, 0, 1);
    }
  }

  /**
   * Set SFX volume
   * @param {number} value - Volume level (0-1)
   */
  setSfxVolume(value) {
    if (this.sfxVolume) {
      this.sfxVolume.gain.value = Utils.clamp(value, 0, 1);
    }
  }

  /**
   * Mute/unmute all audio
   * @param {boolean} muted - True to mute
   */
  setMuted(muted) {
    if (this.masterVolume) {
      this.masterVolume.gain.value = muted ? 0 : CONFIG.AUDIO.MASTER_VOLUME;
    }
  }

  /**
   * Enable/disable sound effects
   * @param {boolean} enabled - True to enable
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Global sound manager instance
const sound = new SoundManager();

// Initialize audio on first user interaction
let audioInitialized = false;
let audioListenersAttached = false;

function initAudio() {
  if (audioInitialized) {
    return;
  }

  try {
    sound.init();
    sound.resume();
    audioInitialized = true;

    // Clean up listeners after initialization
    if (audioListenersAttached) {
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('click', initAudio);
      audioListenersAttached = false;
    }
  } catch (err) {
    console.warn('Audio initialization failed:', err);
  }
}

// Attach listeners for first user interaction
if (!audioListenersAttached) {
  document.addEventListener('touchstart', initAudio);
  document.addEventListener('click', initAudio);
  audioListenersAttached = true;
}
