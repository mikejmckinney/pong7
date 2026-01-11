# Audio Design

## Overview

All audio should have an 8-bit/chiptune aesthetic to match the retro theme. Use the Web Audio API for programmatic sound generation (no audio files needed) or include small .wav/.mp3 files.

---

## Sound Effects

### Required Sounds (9 total)

| Sound | Trigger | Style | Duration |
|-------|---------|-------|----------|
| **Paddle Hit** | Ball hits paddle | Short "bip" beep, pitch varies by hit position | 50-100ms |
| **Wall Bounce** | Ball hits top/bottom wall | Lower "bop" sound | 50ms |
| **Score - Win** | Player scores a point | Ascending chiptune jingle | 500ms |
| **Score - Lose** | Opponent scores | Descending sad tone | 300ms |
| **Game Start** | Match begins | Ascending arpeggio "ready, set, go" | 1000ms |
| **Game Over** | Match ends | Victory fanfare (winner) | 1500ms |
| **Power-Up Spawn** | Power-up appears | Sparkle/shimmer sound | 300ms |
| **Power-Up Collect** | Player gets power-up | Satisfying "ding" pickup | 200ms |
| **Menu Select** | Button press | Click/blip | 50ms |

### Programmatic Sound Generation

Example using Web Audio API:

```javascript
class SoundManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterVolume = this.audioContext.createGain();
    this.masterVolume.connect(this.audioContext.destination);
    this.masterVolume.gain.value = 0.5;
  }
  
  // Resume audio context (required after user interaction)
  async resume() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  // Basic beep sound
  playTone(frequency, duration, type = 'square') {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = type; // 'square', 'sawtooth', 'triangle', 'sine'
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterVolume);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  // Paddle hit - pitch varies by hit position (-1 to 1)
  paddleHit(hitPosition = 0) {
    const baseFreq = 440;
    const freq = baseFreq + (hitPosition * 100); // 340-540 Hz range
    this.playTone(freq, 0.08, 'square');
  }
  
  // Wall bounce
  wallBounce() {
    this.playTone(220, 0.05, 'square');
  }
  
  // Score point (winner)
  scoreWin() {
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'square'), i * 100);
    });
  }
  
  // Score point (loser)
  scoreLose() {
    const notes = [392, 349, 330]; // G4, F4, E4 (descending)
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sawtooth'), i * 80);
    });
  }
  
  // Game start countdown
  gameStart() {
    // 3-2-1-GO
    const beeps = [330, 330, 330, 660]; // E4, E4, E4, E5
    beeps.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square'), i * 400);
    });
  }
  
  // Victory fanfare
  gameOver() {
    const melody = [523, 523, 523, 659, 784, 659, 784];
    const durations = [0.1, 0.1, 0.1, 0.15, 0.3, 0.15, 0.5];
    let time = 0;
    
    melody.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, durations[i], 'square'), time);
      time += durations[i] * 1000 + 50;
    });
  }
  
  // Power-up spawn (shimmer)
  powerUpSpawn() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(800 + i * 200, 0.05, 'sine');
      }, i * 50);
    }
  }
  
  // Power-up collect
  powerUpCollect() {
    this.playTone(880, 0.05, 'square');
    setTimeout(() => this.playTone(1108, 0.1, 'square'), 50);
  }
  
  // Menu click
  menuSelect() {
    this.playTone(660, 0.05, 'square');
  }
  
  // Set master volume (0 to 1)
  setVolume(value) {
    this.masterVolume.gain.value = Math.max(0, Math.min(1, value));
  }
}

// Usage
const sound = new SoundManager();

// Must call after first user interaction (click/touch)
document.addEventListener('click', () => sound.resume(), { once: true });
```

---

## Background Music (Optional)

If including background music:

### Requirements
- Looping synthwave/retrowave track
- 80-120 BPM
- Duration: 1-3 minutes (loops seamlessly)
- File size: Under 500KB (compressed)
- Format: MP3 or OGG

### Implementation
```javascript
class MusicPlayer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.musicGain = audioContext.createGain();
    this.musicGain.connect(audioContext.destination);
    this.musicGain.gain.value = 0.3;
    this.currentTrack = null;
  }
  
  async loadTrack(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }
  
  play() {
    if (this.currentTrack) this.stop();
    
    this.currentTrack = this.audioContext.createBufferSource();
    this.currentTrack.buffer = this.audioBuffer;
    this.currentTrack.loop = true;
    this.currentTrack.connect(this.musicGain);
    this.currentTrack.start();
  }
  
  stop() {
    if (this.currentTrack) {
      this.currentTrack.stop();
      this.currentTrack = null;
    }
  }
  
  setVolume(value) {
    this.musicGain.gain.value = Math.max(0, Math.min(1, value));
  }
}
```

### Free Music Resources
If you need royalty-free synthwave music:
- OpenGameArt.org
- Freesound.org
- Generate with Suno/Udio (AI music)
- Or omit music entirely (SFX only is fine)

---

## Audio Settings

### User Controls
- **Master Volume**: 0-100% slider
- **SFX Volume**: 0-100% slider  
- **Music Volume**: 0-100% slider (if music included)
- **Mute Toggle**: Quick on/off button

### Persistence
Save audio settings to localStorage:
```javascript
const settings = {
  masterVolume: 0.5,
  sfxVolume: 0.7,
  musicVolume: 0.3,
  muted: false
};

localStorage.setItem('pongAudioSettings', JSON.stringify(settings));
```

---

## Mobile Audio Considerations

### iOS Safari Limitations
- AudioContext must be created/resumed after user gesture
- Cannot autoplay audio without interaction
- Solution: Show "Tap to Start" screen, initialize audio on tap

```javascript
let audioInitialized = false;

function initAudio() {
  if (audioInitialized) return;
  
  sound.resume();
  audioInitialized = true;
}

// Attach to first user interaction
document.addEventListener('touchstart', initAudio, { once: true });
document.addEventListener('click', initAudio, { once: true });
```

### Battery Considerations
- Stop/pause music when game is paused or in background
- Use `visibilitychange` event to detect tab switching

```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    music.stop();
  } else {
    music.play();
  }
});
```

---

## Frequency Reference (Musical Notes)

For creating chiptune sounds:

| Note | Frequency (Hz) |
|------|----------------|
| C4 | 261.63 |
| D4 | 293.66 |
| E4 | 329.63 |
| F4 | 349.23 |
| G4 | 392.00 |
| A4 | 440.00 |
| B4 | 493.88 |
| C5 | 523.25 |
| D5 | 587.33 |
| E5 | 659.25 |
| G5 | 783.99 |
| C6 | 1046.50 |

---

## ✅ Verification Checkpoint

After reading this file, confirm your understanding by answering:

1. How many required sound effects are there?
2. What Web API is used for programmatic sound generation?
3. Why must audio be initialized after user interaction on iOS Safari?
4. What oscillator type creates the classic 8-bit square wave sound?

**Response Format:**
```
03-audio.md verified ✓
Answers: [___ sound effects] | [___ API] | [iOS requires: ___] | [Oscillator type: ___]
```
