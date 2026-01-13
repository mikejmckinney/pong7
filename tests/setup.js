/**
 * Jest test setup
 * Provides global setup for all tests
 */

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = String(value);
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Mock performance.now
if (typeof performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now())
  };
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock navigator.vibrate
global.navigator.vibrate = jest.fn();

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'square',
      frequency: { value: 440 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }
  createGain() {
    return {
      gain: { 
        value: 1,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn()
    };
  }
  resume() {
    return Promise.resolve();
  }
}

global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.store = {};
});
