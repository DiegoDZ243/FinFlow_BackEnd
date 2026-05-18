module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/jest.setup.js'],
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
};
