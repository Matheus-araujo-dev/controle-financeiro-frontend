import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const testSetup = fileURLToPath(new URL('./src/test/setup.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: testSetup,
    css: true,
    testTimeout: 20000,
    // Specs de tests/e2e são do Playwright e não podem rodar dentro do Vitest.
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 79,
        functions: 79,
        statements: 79,
        branches: 68
      }
    }
  }
});
