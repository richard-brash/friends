import dotenv from 'dotenv';
import { vi, beforeAll, afterAll } from 'vitest';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console.log for cleaner test output (but keep error/warn for debugging)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn()
};

// Basic setup - we'll initialize database per test suite as needed
beforeAll(async () => {
  console.log('🧪 Test setup initialized');
});

afterAll(async () => {
  console.log('🧪 Test cleanup completed');
});