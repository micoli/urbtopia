import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'guide.e2e.ts',
  outputDir: 'test-results/guide',
  snapshotDir: './e2e-baselines',
  fullyParallel: true,
  timeout: 300_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: { baseURL: 'http://127.0.0.1:4176', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4176 --strictPort', url: 'http://127.0.0.1:4176', reuseExistingServer: !process.env.CI },
});
