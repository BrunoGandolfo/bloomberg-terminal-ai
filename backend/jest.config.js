module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/__tests__/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'services/**/*.js',
    'routes/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}; 