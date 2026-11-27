import { defineConfig, devices } from '@playwright/test';

// End-to-end tests (e2e/*.spec.ts) run against the production build, served by `vite preview`.
// No fake-camera flags (tech.md): the camera never starts in this slice.
export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    {
      name: 'chromium',
      // The viewport comes after the device preset, which would otherwise set 1280×720.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    // A preview already running on port 4173 is reused as it is, with no new build.
    reuseExistingServer: true,
    // Room for the type check and the build before the server starts (Playwright's default is 60 s).
    timeout: 180_000,
  },
});
