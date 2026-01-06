import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    globals: true, // Enables describe, it, expect globally
    coverage: {
      provider: 'c8',
      include: ['services/**/*.js', 'routes/**/*.js', 'middleware/**/*.js'],
      exclude: ['**/node_modules/**', 'tests/**']
    }
  }
});