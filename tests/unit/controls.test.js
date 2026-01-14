/**
 * Unit tests for Controls module
 * Tests online mode controls (arrow keys, touch behavior, mouse input)
 */

const path = require('path');

// Load dependencies in order
const CONFIG = require(path.join(__dirname, '../../js/config.js'));
global.CONFIG = CONFIG;

const Utils = require(path.join(__dirname, '../../js/utils.js'));
global.Utils = Utils;

// Mock canvas
const mockCanvas = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600
  }))
};

// Mock document
global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const Controls = require(path.join(__dirname, '../../js/controls.js'));

describe('Controls', () => {
  let controls;

  beforeEach(() => {
    jest.clearAllMocks();
    controls = new Controls(mockCanvas);
  });

  describe('getPlayer1Input - Online Mode', () => {
    test('accepts W/w keys in online mode', () => {
      controls.keys['w'] = true;
      const input = controls.getPlayer1Input('online');
      expect(input.direction).toBe(-1); // Up
      
      controls.keys['w'] = false;
      controls.keys['W'] = true;
      const input2 = controls.getPlayer1Input('online');
      expect(input2.direction).toBe(-1);
    });

    test('accepts S/s keys in online mode', () => {
      controls.keys['s'] = true;
      const input = controls.getPlayer1Input('online');
      expect(input.direction).toBe(1); // Down
      
      controls.keys['s'] = false;
      controls.keys['S'] = true;
      const input2 = controls.getPlayer1Input('online');
      expect(input2.direction).toBe(1);
    });

    test('accepts ArrowUp in online mode (not just W/S)', () => {
      controls.keys['ArrowUp'] = true;
      const input = controls.getPlayer1Input('online');
      expect(input.direction).toBe(-1); // Up
    });

    test('accepts ArrowDown in online mode (not just W/S)', () => {
      controls.keys['ArrowDown'] = true;
      const input = controls.getPlayer1Input('online');
      expect(input.direction).toBe(1); // Down
    });

    test('arrow keys do NOT work for player 1 in single mode', () => {
      controls.keys['ArrowUp'] = true;
      const input = controls.getPlayer1Input('single');
      expect(input.direction).toBe(0); // No movement
    });

    test('arrow keys do NOT work for player 1 in local mode', () => {
      controls.keys['ArrowUp'] = true;
      const input = controls.getPlayer1Input('local');
      expect(input.direction).toBe(0); // No movement (arrows are for P2 in local)
    });
  });

  describe('getPlayer1Input - Touch Zones', () => {
    test('uses full screen for touch in single mode', () => {
      controls.touches = {
        1: { x: 600, y: 300, relativeX: 0.75 } // Right side of screen
      };
      
      const input = controls.getPlayer1Input('single');
      expect(input.y).toBe(300 * controls.sensitivity);
    });

    test('uses full screen for touch in online mode', () => {
      controls.touches = {
        1: { x: 600, y: 300, relativeX: 0.75 } // Right side of screen
      };
      
      const input = controls.getPlayer1Input('online');
      expect(input.y).toBe(300 * controls.sensitivity);
    });

    test('only uses left half for touch in local mode', () => {
      // Touch on right side (relativeX >= 0.5)
      controls.touches = {
        1: { x: 600, y: 300, relativeX: 0.75 }
      };
      
      const input = controls.getPlayer1Input('local');
      expect(input.y).toBeNull(); // Right side ignored for P1 in local mode
    });

    test('uses left half for P1 in local mode', () => {
      // Touch on left side (relativeX < 0.5)
      controls.touches = {
        1: { x: 200, y: 300, relativeX: 0.25 }
      };
      
      const input = controls.getPlayer1Input('local');
      expect(input.y).toBe(300 * controls.sensitivity);
    });
  });

  describe('getPlayer1Input - Mouse Input', () => {
    test('mouse input works in single player mode', () => {
      controls.mouseActive = true;
      controls.mouseY = 250;
      
      const input = controls.getPlayer1Input('single');
      expect(input.y).toBe(250 * controls.sensitivity);
    });

    test('mouse input works in online mode', () => {
      controls.mouseActive = true;
      controls.mouseY = 250;
      
      const input = controls.getPlayer1Input('online');
      expect(input.y).toBe(250 * controls.sensitivity);
    });

    test('mouse input does NOT work in local multiplayer mode', () => {
      controls.mouseActive = true;
      controls.mouseY = 250;
      
      const input = controls.getPlayer1Input('local');
      // Mouse should be ignored in local mode (null unless touch provides it)
      expect(input.y).toBeNull();
    });
  });

  describe('getPlayer2Input - Local Mode', () => {
    test('arrow keys work for player 2 in local mode', () => {
      controls.keys['ArrowUp'] = true;
      const input = controls.getPlayer2Input('local');
      expect(input.direction).toBe(-1); // Up
      
      controls.keys['ArrowUp'] = false;
      controls.keys['ArrowDown'] = true;
      const input2 = controls.getPlayer2Input('local');
      expect(input2.direction).toBe(1); // Down
    });

    test('touch on right half works for player 2 in local mode', () => {
      controls.touches = {
        1: { x: 600, y: 300, relativeX: 0.75 }
      };
      
      const input = controls.getPlayer2Input('local');
      expect(input.y).toBe(300 * controls.sensitivity);
    });

    test('touch on left half ignored for player 2 in local mode', () => {
      controls.touches = {
        1: { x: 200, y: 300, relativeX: 0.25 }
      };
      
      const input = controls.getPlayer2Input('local');
      expect(input.y).toBeNull();
    });
  });

  describe('getPlayer2Input - Single Player Mode', () => {
    test('returns empty input in single player mode (AI controlled)', () => {
      controls.keys['ArrowUp'] = true;
      controls.keys['ArrowDown'] = true;
      
      const input = controls.getPlayer2Input('single');
      expect(input.y).toBeNull();
      expect(input.direction).toBe(0);
    });
  });

  describe('Control Sensitivity', () => {
    test('applies sensitivity to touch input', () => {
      controls.setSensitivity(1.5);
      controls.touches = {
        1: { x: 200, y: 200, relativeX: 0.25 }
      };
      
      const input = controls.getPlayer1Input('single');
      expect(input.y).toBe(200 * 1.5);
    });

    test('applies sensitivity to mouse input', () => {
      controls.setSensitivity(0.8);
      controls.mouseActive = true;
      controls.mouseY = 300;
      
      const input = controls.getPlayer1Input('single');
      expect(input.y).toBe(300 * 0.8);
    });

    test('clamps sensitivity between 0.5 and 2.0', () => {
      controls.setSensitivity(3.0);
      expect(controls.sensitivity).toBe(2.0);
      
      controls.setSensitivity(0.1);
      expect(controls.sensitivity).toBe(0.5);
    });
  });

  describe('Invert Controls', () => {
    test('inverts keyboard direction when enabled', () => {
      controls.setInvertControls(true);
      controls.keys['w'] = true;
      
      const input = controls.getPlayer1Input('single');
      expect(input.direction).toBe(1); // Inverted: up becomes down
    });

    test('does not invert when disabled', () => {
      controls.setInvertControls(false);
      controls.keys['w'] = true;
      
      const input = controls.getPlayer1Input('single');
      expect(input.direction).toBe(-1); // Normal: w is up
    });
  });

  describe('Reset', () => {
    test('clears all input state', () => {
      controls.keys['w'] = true;
      controls.touches = { 1: { x: 100, y: 100 } };
      controls.mouseY = 200;
      controls.mouseActive = true;
      
      controls.reset();
      
      expect(controls.keys).toEqual({});
      expect(controls.touches).toEqual({});
      expect(controls.mouseY).toBeNull();
      expect(controls.mouseActive).toBe(false);
    });
  });

  describe('hasAnyInput', () => {
    test('returns true when key is pressed', () => {
      controls.keys['w'] = true;
      expect(controls.hasAnyInput()).toBe(true);
    });

    test('returns true when touch is active', () => {
      controls.touches = { 1: { x: 100, y: 100 } };
      expect(controls.hasAnyInput()).toBe(true);
    });

    test('returns true when mouse is active', () => {
      controls.mouseActive = true;
      expect(controls.hasAnyInput()).toBe(true);
    });

    test('returns false when no input', () => {
      expect(controls.hasAnyInput()).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    test('stores bound handlers for proper cleanup', () => {
      expect(controls._boundHandlers).toBeDefined();
      expect(controls._boundHandlers.touchStart).toBeDefined();
      expect(controls._boundHandlers.touchMove).toBeDefined();
      expect(controls._boundHandlers.touchEnd).toBeDefined();
      expect(controls._boundHandlers.keyDown).toBeDefined();
      expect(controls._boundHandlers.keyUp).toBeDefined();
      expect(controls._boundHandlers.mouseMove).toBeDefined();
    });
  });
});
