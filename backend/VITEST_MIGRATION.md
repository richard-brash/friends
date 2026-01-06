# Migration Guide: Jest → Vitest

## Why Vitest?
- **Native ES6 modules**: No Babel configuration needed
- **Fast**: Vite-powered, instant test runs
- **Jest-compatible**: Same API, easy migration
- **Better DX**: Better error messages, built-in coverage

## Migration Steps:

### 1. Install Vitest
```bash
npm uninstall jest babel-jest @babel/core @babel/preset-env
npm install --save-dev vitest @vitest/ui
```

### 2. Update package.json scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest run --coverage"
  }
}
```

### 3. Replace jest.config.json with vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['services/**/*.js', 'routes/**/*.js', 'middleware/**/*.js'],
      exclude: ['**/node_modules/**']
    }
  }
});
```

### 4. Update test imports (minimal changes)
```javascript
// Before (Jest)
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// After (Vitest)
import { describe, it, expect, beforeEach, vi } from 'vitest';
// Change jest.fn() to vi.fn()
```

## Benefits:
- No more ES6 module configuration issues
- Faster test runs
- Better error messages
- Built-in TypeScript support
- Watch mode that actually works

## Trade-offs:
- One more dependency change
- Need to update existing tests (minimal effort)
- Less mature ecosystem than Jest