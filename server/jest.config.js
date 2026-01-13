module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['*.js', 'lib/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '*.test.js'],
  testTimeout: 10000,
  verbose: true,
  // Force exit after tests complete (handles server intervals/timeouts)
  forceExit: true
};
