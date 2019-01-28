// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  rootDir: 'test',  
  testEnvironment: "node",
  testMatch: [ "**/test/integration/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)" ],
  globalSetup: '<rootDir>/jest-global-setup.js',
  globalTeardown: '<rootDir>/jest-global-teardown.js',
  setupTestFrameworkScriptFile: '<rootDir>/jest.setup.js'
};
