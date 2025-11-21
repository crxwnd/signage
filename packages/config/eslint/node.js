/**
 * ESLint configuration for Node.js backend projects
 * Extends base TypeScript config with Node.js specific rules
 */

module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Node.js specific rules
    'no-process-exit': 'error',
    'no-path-concat': 'error',

    // Allow console in backend
    'no-console': 'off',

    // Async/await best practices
    'require-await': 'error',
    'no-return-await': 'error',
  },
};
