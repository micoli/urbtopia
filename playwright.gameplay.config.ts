import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: ['gameplay.e2e.ts', 'solidarity.e2e.ts', 'serviceCoverage.e2e.ts', 'politics.e2e.ts', 'visit.e2e.ts', 'analytics.e2e.ts', 'cities.e2e.ts', 'shipments.e2e.ts', 'dayCycle.e2e.ts'],
  outputDir: 'test-results/gameplay',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI },
});
