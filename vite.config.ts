import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit and property tests only. End-to-end tests live in e2e/ and run with Playwright.
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
    // Worker threads: fast for pure TypeScript, and no child processes
    // (those hang when started from Kiro's shell sandbox).
    pool: 'threads',
  },
});
