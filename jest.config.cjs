module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!(canvas|@jspsych)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};