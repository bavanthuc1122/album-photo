module.exports = {
    testEnvironment: 'node',
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/setup.js']
  };