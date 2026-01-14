module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }]
  },
  globals: {
    CONFIG: 'readonly',
    Utils: 'readonly',
    Physics: 'readonly',
    Controls: 'readonly',
    AI: 'readonly',
    SoundManager: 'readonly',
    sound: 'readonly',
    Renderer: 'readonly',
    Storage: 'readonly',
    Leaderboard: 'readonly',
    Screens: 'readonly',
    PowerUpManager: 'readonly',
    Game: 'readonly',
    game: 'writable',
    initAudio: 'readonly',
    enableGameplayTouchPrevention: 'readonly',
    disableGameplayTouchPrevention: 'readonly',
    // Socket.io client (loaded from CDN)
    io: 'readonly',
    // Supabase client (loaded from CDN)
    supabase: 'readonly',
    // Multiplayer client class
    MultiplayerClient: 'readonly'
  }
};
