/**
 * Controls module for Pong game
 * Handles touch, keyboard, and mouse input
 */

class Controls {
  constructor(canvas) {
    this.canvas = canvas;
    this.touches = {};
    this.keys = {};
    this.mouseY = null;
    this.mouseActive = false;

    // Touch zones for local multiplayer
    this.touchZones = {
      left: { start: 0, end: 0.5 },
      right: { start: 0.5, end: 1.0 }
    };

    // Player input state
    this.player1Input = { y: null, direction: 0 };
    this.player2Input = { y: null, direction: 0 };

    // Settings
    this.sensitivity = 1.0;
    this.invertControls = false;

    // Store bound handlers for proper removal
    this._boundHandlers = {
      touchStart: this.handleTouchStart.bind(this),
      touchMove: this.handleTouchMove.bind(this),
      touchEnd: this.handleTouchEnd.bind(this),
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      mouseEnter: () => { this.mouseActive = true; },
      mouseLeave: () => { this.mouseActive = false; }
    };

    this.setupTouchListeners();
    this.setupKeyboardListeners();
    this.setupMouseListeners();
  }

  /**
   * Setup touch event listeners
   */
  setupTouchListeners() {
    this.canvas.addEventListener('touchstart', this._boundHandlers.touchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._boundHandlers.touchMove, { passive: false });
    this.canvas.addEventListener('touchend', this._boundHandlers.touchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this._boundHandlers.touchEnd, { passive: false });
  }

  /**
   * Setup keyboard event listeners
   */
  setupKeyboardListeners() {
    document.addEventListener('keydown', this._boundHandlers.keyDown);
    document.addEventListener('keyup', this._boundHandlers.keyUp);
  }

  /**
   * Setup mouse event listeners
   */
  setupMouseListeners() {
    this.canvas.addEventListener('mousemove', this._boundHandlers.mouseMove);
    this.canvas.addEventListener('mouseenter', this._boundHandlers.mouseEnter);
    this.canvas.addEventListener('mouseleave', this._boundHandlers.mouseLeave);
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const pos = this.getTouchPosition(touch);
      this.touches[touch.identifier] = pos;
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (this.touches[touch.identifier]) {
        const pos = this.getTouchPosition(touch);
        this.touches[touch.identifier] = pos;
      }
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      delete this.touches[touch.identifier];
    }
  }

  /**
   * Get touch position relative to canvas
   * @param {Touch} touch - Touch object
   * @returns {Object} Position {x, y, relativeX}
   */
  getTouchPosition(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const relativeX = x / rect.width;
    return { x, y, relativeX };
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    this.keys[e.key] = true;

    // Prevent default for game keys
    if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
      e.preventDefault();
    }
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyUp(e) {
    this.keys[e.key] = false;
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseY = e.clientY - rect.top;
  }

  /**
   * Get player 1 input (left paddle)
   * @param {string} mode - Game mode ('single', 'local', 'online')
   * @returns {Object} Input {y: number|null, direction: number}
   */
  getPlayer1Input(mode) {
    const input = { y: null, direction: 0 };

    // Keyboard input (W/S keys)
    // For online mode, also accept arrow keys since player may be used to different controls
    if (this.keys['w'] || this.keys['W'] || (mode === 'online' && this.keys['ArrowUp'])) {
      input.direction = this.invertControls ? 1 : -1;
    } else if (this.keys['s'] || this.keys['S'] || (mode === 'online' && this.keys['ArrowDown'])) {
      input.direction = this.invertControls ? -1 : 1;
    }

    // Touch input - left half of screen for local multiplayer, full screen for single/online
    for (const id in this.touches) {
      const touch = this.touches[id];
      // In local mode, only use left half of screen; otherwise use full screen
      const useLeftHalf = mode === 'local';
      if (!useLeftHalf || touch.relativeX < this.touchZones.left.end) {
        input.y = touch.y * this.sensitivity;
        break;
      }
    }

    // Mouse input (for single player and online modes, not local multiplayer)
    if ((mode === 'single' || mode === 'online') && this.mouseActive && this.mouseY !== null) {
      input.y = this.mouseY * this.sensitivity;
    }

    return input;
  }

  /**
   * Get player 2 input (right paddle)
   * @param {string} mode - Game mode ('single', 'local', 'online')
   * @returns {Object} Input {y: number|null, direction: number}
   */
  getPlayer2Input(mode) {
    const input = { y: null, direction: 0 };

    // In single player mode, player 2 is AI controlled
    if (mode === 'single') {
      return input;
    }

    // Keyboard input (Arrow keys)
    if (this.keys['ArrowUp']) {
      input.direction = this.invertControls ? 1 : -1;
    } else if (this.keys['ArrowDown']) {
      input.direction = this.invertControls ? -1 : 1;
    }

    // Touch input - right half of screen
    for (const id in this.touches) {
      const touch = this.touches[id];
      if (touch.relativeX >= this.touchZones.right.start) {
        input.y = touch.y * this.sensitivity;
        break;
      }
    }

    return input;
  }

  /**
   * Check if any control input is active
   * @returns {boolean} True if any input is detected
   */
  hasAnyInput() {
    // Check keyboard
    for (const key in this.keys) {
      if (this.keys[key]) {
        return true;
      }
    }

    // Check touches
    if (Object.keys(this.touches).length > 0) {
      return true;
    }

    // Check mouse
    if (this.mouseActive) {
      return true;
    }

    return false;
  }

  /**
   * Check if a specific key is pressed
   * @param {string} key - Key to check
   * @returns {boolean} True if key is pressed
   */
  isKeyPressed(key) {
    return this.keys[key] === true;
  }

  /**
   * Set control sensitivity
   * @param {number} value - Sensitivity value (0.5 to 2.0)
   */
  setSensitivity(value) {
    this.sensitivity = Utils.clamp(value, 0.5, 2.0);
  }

  /**
   * Set invert controls option
   * @param {boolean} invert - True to invert controls
   */
  setInvertControls(invert) {
    this.invertControls = invert;
  }

  /**
   * Reset all input state
   */
  reset() {
    this.touches = {};
    this.keys = {};
    this.mouseY = null;
    this.mouseActive = false;
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    this.canvas.removeEventListener('touchstart', this._boundHandlers.touchStart);
    this.canvas.removeEventListener('touchmove', this._boundHandlers.touchMove);
    this.canvas.removeEventListener('touchend', this._boundHandlers.touchEnd);
    this.canvas.removeEventListener('touchcancel', this._boundHandlers.touchEnd);
    this.canvas.removeEventListener('mousemove', this._boundHandlers.mouseMove);
    this.canvas.removeEventListener('mouseenter', this._boundHandlers.mouseEnter);
    this.canvas.removeEventListener('mouseleave', this._boundHandlers.mouseLeave);
    document.removeEventListener('keydown', this._boundHandlers.keyDown);
    document.removeEventListener('keyup', this._boundHandlers.keyUp);
  }
}

// Prevent default touch behaviors during gameplay
let gameplayTouchHandler = null;
let currentCanvas = null;

function handleGameplayTouchMove(e) {
  e.preventDefault();
}

function enableGameplayTouchPrevention(canvas) {
  if (!gameplayTouchHandler && canvas) {
    canvas.addEventListener('touchmove', handleGameplayTouchMove, { passive: false });
    gameplayTouchHandler = true;
    currentCanvas = canvas;
  }
}

function disableGameplayTouchPrevention(canvas) {
  if (gameplayTouchHandler) {
    const targetCanvas = canvas || currentCanvas;
    if (targetCanvas) {
      targetCanvas.removeEventListener('touchmove', handleGameplayTouchMove);
    }
    gameplayTouchHandler = null;
    currentCanvas = null;
  }
}
