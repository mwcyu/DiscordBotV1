module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup/setupTests.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/tests/**/*.spec.js"],
  collectCoverageFrom: [
    "commands/**/*.js",
    "events/**/*.js",
    "models/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  testTimeout: 30000,
  // Module name mapping to replace discord.js with our mock
  moduleNameMapper: {
    "^discord\\.js$": "<rootDir>/tests/mocks/discord.js",
  },
};
