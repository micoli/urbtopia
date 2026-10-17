import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'visual.e2e.ts',
  outputDir: 'test-results/visual',
  snapshotDir: './e2e-baselines',
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: { baseURL: 'http://127.0.0.1:4175', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: !process.env.CI },
});
