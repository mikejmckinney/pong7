/**
 * Screens module for Pong game
 * Handles menu UI, overlays, and screen transitions
 */

const Screens = {
  overlay: null,
  currentScreen: null,
  onAction: null,

  /**
   * Initialize screens module
   * @param {HTMLElement} overlayElement - UI overlay container element
   * @param {Function} actionCallback - Callback for menu actions
   */
  init(overlayElement, actionCallback) {
    this.overlay = overlayElement;
    this.onAction = actionCallback;
  },

  /**
   * Show main menu
   */
  showMainMenu() {
    this.currentScreen = 'menu';
    this.overlay.innerHTML = `
      <div class="screen main-menu" data-testid="main-menu">
        <h1 class="title">◆ PONG ◆</h1>
        <div class="menu-buttons">
          <button class="menu-btn" data-action="play" data-testid="play-button">PLAY</button>
          <button class="menu-btn" data-action="settings" data-testid="settings-button">SETTINGS</button>
          <button class="menu-btn" data-action="leaderboard" data-testid="leaderboard-button">LEADERBOARD</button>
          <button class="menu-btn" data-action="howto">HOW TO PLAY</button>
        </div>
      </div>
    `;
    this.attachButtonListeners();
    this.overlay.classList.remove('hidden');
  },

  /**
   * Show mode selection screen
   */
  showModeSelect() {
    this.currentScreen = 'modeSelect';
    this.overlay.innerHTML = `
      <div class="screen mode-select">
        <h2 class="subtitle">SELECT MODE</h2>
        <div class="menu-buttons">
          <button class="menu-btn" data-action="single" data-testid="single-player">SINGLE PLAYER</button>
          <button class="menu-btn" data-action="local" data-testid="local-multiplayer">LOCAL MULTI</button>
          <button class="menu-btn" data-action="online" data-testid="online-multiplayer" disabled>ONLINE</button>
        </div>
        <button class="back-btn" data-action="back" data-testid="back-button">← BACK</button>
      </div>
    `;
    this.attachButtonListeners();
  },

  /**
   * Show variant selection screen (Classic vs Chaos)
   */
  showVariantSelect() {
    this.currentScreen = 'variantSelect';
    this.overlay.innerHTML = `
      <div class="screen variant-select">
        <h2 class="subtitle">GAME TYPE</h2>
        <div class="menu-buttons">
          <button class="menu-btn" data-action="variant" data-value="classic" data-testid="variant-classic">
            ⚔ CLASSIC
            <span class="variant-desc">Pure Pong • First to 11</span>
          </button>
          <button class="menu-btn" data-action="variant" data-value="chaos" data-testid="variant-chaos">
            💥 CHAOS MODE
            <span class="variant-desc">Power-ups • First to 7</span>
          </button>
          <button class="menu-btn" data-action="variant" data-value="speedrun" data-testid="variant-speedrun">
            ⚡ SPEED RUN
            <span class="variant-desc">Fast ball • First to 5</span>
          </button>
        </div>
        <button class="back-btn" data-action="back" data-testid="back-button">← BACK</button>
      </div>
    `;
    this.attachButtonListeners();
  },

  /**
   * Show difficulty selection screen
   */
  showDifficultySelect() {
    this.currentScreen = 'difficultySelect';
    const settings = Storage.getSettings();
    const currentDifficulty = settings.difficulty || 'medium';

    this.overlay.innerHTML = `
      <div class="screen difficulty-select">
        <h2 class="subtitle">DIFFICULTY</h2>
        <div class="menu-buttons">
          <button class="menu-btn ${currentDifficulty === 'easy' ? 'selected' : ''}" data-action="difficulty" data-value="easy" data-testid="difficulty-easy">
            EASY <span class="stars">★☆☆☆</span>
          </button>
          <button class="menu-btn ${currentDifficulty === 'medium' ? 'selected' : ''}" data-action="difficulty" data-value="medium" data-testid="difficulty-medium">
            MEDIUM <span class="stars">★★☆☆</span>
          </button>
          <button class="menu-btn ${currentDifficulty === 'hard' ? 'selected' : ''}" data-action="difficulty" data-value="hard" data-testid="difficulty-hard">
            HARD <span class="stars">★★★☆</span>
          </button>
          <button class="menu-btn ${currentDifficulty === 'impossible' ? 'selected' : ''}" data-action="difficulty" data-value="impossible" data-testid="difficulty-impossible">
            IMPOSSIBLE <span class="stars">★★★★</span>
          </button>
        </div>
        <button class="back-btn" data-action="back" data-testid="back-button">← BACK</button>
      </div>
    `;
    this.attachButtonListeners();
  },

  /**
   * Show settings screen
   */
  showSettings() {
    this.currentScreen = 'settings';
    const settings = Storage.getSettings();

    this.overlay.innerHTML = `
      <div class="screen settings-screen" data-testid="settings-screen">
        <h2 class="subtitle">SETTINGS</h2>
        <div class="settings-list">
          <div class="setting-item">
            <label>Sound</label>
            <input type="range" min="0" max="100" value="${settings.sfxVolume * 100}" data-setting="sfxVolume">
          </div>
          <div class="setting-item">
            <label>Music</label>
            <input type="range" min="0" max="100" value="${settings.musicVolume * 100}" data-setting="musicVolume">
          </div>
          <div class="setting-item">
            <label>Haptics</label>
            <button class="toggle-btn ${settings.hapticEnabled ? 'on' : ''}" data-setting="hapticEnabled" data-value="${settings.hapticEnabled}">
              ${settings.hapticEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="setting-item">
            <label>Particles</label>
            <button class="toggle-btn ${settings.particlesEnabled ? 'on' : ''}" data-setting="particlesEnabled" data-value="${settings.particlesEnabled}">
              ${settings.particlesEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div class="setting-item">
            <label>Scanlines</label>
            <button class="toggle-btn ${settings.scanlinesEnabled ? 'on' : ''}" data-setting="scanlinesEnabled" data-value="${settings.scanlinesEnabled}">
              ${settings.scanlinesEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        <button class="back-btn" data-action="back" data-testid="back-button">← BACK</button>
      </div>
    `;
    this.attachButtonListeners();
    this.attachSettingsListeners();
  },

  /**
   * Show how to play screen
   */
  showHowToPlay() {
    this.currentScreen = 'howto';
    this.overlay.innerHTML = `
      <div class="screen howto-screen">
        <h2 class="subtitle">HOW TO PLAY</h2>
        <div class="instructions">
          <div class="instruction-section">
            <h3>🎮 CONTROLS</h3>
            <p><strong>Mobile:</strong> Touch & drag to move paddle</p>
            <p><strong>Keyboard:</strong> W/S or ↑/↓ keys</p>
            <p><strong>Mouse:</strong> Move to control paddle</p>
          </div>
          <div class="instruction-section">
            <h3>🏆 OBJECTIVE</h3>
            <p>Score 11 points to win!</p>
            <p>Don't let the ball pass your paddle.</p>
          </div>
          <div class="instruction-section">
            <h3>💡 TIPS</h3>
            <p>Hit with paddle edge for steeper angles</p>
            <p>Ball speeds up each rally</p>
          </div>
        </div>
        <button class="back-btn" data-action="back" data-testid="back-button">← BACK</button>
      </div>
    `;
    this.attachButtonListeners();
  },

  /**
   * Show leaderboard screen
   */
  showLeaderboard() {
    this.currentScreen = 'leaderboard';
    const stats = Storage.getLocalStats();

    this.overlay.innerHTML = `
      <div class="screen leaderboard-screen" data-testid="leaderboard-screen">
        <h2 class="subtitle">YOUR STATS</h2>
        <div class="stats-list">
          <div class="stat-item">
            <span class="stat-label">Games Played</span>
            <span class="stat-value">${stats.gamesPlayed}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Wins</span>
            <span class="stat-value">${stats.gamesWon}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Losses</span>
            <span class="stat-value">${stats.gamesLost}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Win Rate</span>
            <span class="stat-value">${stats.gamesPlayed > 0 ? Math.round(stats.gamesWon / stats.gamesPlayed * 100) : 0}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Best Streak</span>
            <span class="stat-value">${stats.longestWinStreak}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Highest Score</span>
            <span class="stat-value">${stats.highestScore}</span>
          </div>
        </div>
        <p class="online-note">Online leaderboard coming soon!</p>
        <button class="back-btn" data-action="back" data-testid="back-button">← BACK</button>
      </div>
    `;
    this.attachButtonListeners();
  },

  /**
   * Show pause menu
   */
  showPauseMenu() {
    this.currentScreen = 'pause';
    this.overlay.innerHTML = `
      <div class="screen pause-menu" data-testid="pause-menu">
        <h2 class="subtitle">⏸ PAUSED</h2>
        <div class="menu-buttons">
          <button class="menu-btn" data-action="resume" data-testid="resume-button">RESUME</button>
          <button class="menu-btn" data-action="restart">RESTART</button>
          <button class="menu-btn" data-action="settings">SETTINGS</button>
          <button class="menu-btn" data-action="quit">QUIT</button>
        </div>
      </div>
    `;
    this.attachButtonListeners();
    this.overlay.classList.remove('hidden');
  },

  /**
   * Show game over screen
   * @param {number} winner - Winner (1 or 2)
   * @param {number} score1 - Player 1 score
   * @param {number} score2 - Player 2 score
   * @param {string} mode - Game mode
   */
  showGameOver(winner, score1, score2, mode) {
    this.currentScreen = 'gameover';
    const winnerName = mode === 'single'
      ? (winner === 1 ? 'YOU WIN!' : 'AI WINS!')
      : `PLAYER ${winner} WINS!`;

    this.overlay.innerHTML = `
      <div class="screen gameover-screen">
        <h2 class="winner-text ${winner === 1 ? 'cyan' : 'pink'}">${winnerName}</h2>
        <div class="final-score">${score1} - ${score2}</div>
        <div class="menu-buttons">
          <button class="menu-btn" data-action="rematch">REMATCH</button>
          <button class="menu-btn" data-action="menu">MAIN MENU</button>
        </div>
      </div>
    `;
    this.attachButtonListeners();
    this.overlay.classList.remove('hidden');
  },

  /**
   * Hide overlay
   */
  hide() {
    this.overlay.classList.add('hidden');
    this.currentScreen = null;
  },

  /**
   * Attach click listeners to menu buttons
   */
  attachButtonListeners() {
    const buttons = this.overlay.querySelectorAll('[data-action]');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        sound.menuSelect();
        const action = button.dataset.action;
        const value = button.dataset.value;

        if (this.onAction) {
          this.onAction(action, value);
        }
      });
    });
  },

  /**
   * Attach listeners for settings controls
   */
  attachSettingsListeners() {
    // Range sliders
    const sliders = this.overlay.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const setting = slider.dataset.setting;
        const value = parseInt(slider.value, 10) / 100;
        Storage.updateSetting(setting, value);

        // Apply volume changes
        if (setting === 'sfxVolume') {
          sound.setSfxVolume(value);
        } else if (setting === 'masterVolume') {
          sound.setMasterVolume(value);
        }
      });
    });

    // Toggle buttons
    const toggles = this.overlay.querySelectorAll('.toggle-btn');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const setting = toggle.dataset.setting;
        const currentValue = toggle.dataset.value === 'true';
        const newValue = !currentValue;

        toggle.dataset.value = newValue;
        toggle.textContent = newValue ? 'ON' : 'OFF';
        toggle.classList.toggle('on', newValue);

        Storage.updateSetting(setting, newValue);
      });
    });
  }
};
