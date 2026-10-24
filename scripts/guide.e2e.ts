import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const GUIDE_DIR = 'dist/docs';
const BATCHES = 8;

function pagesIn(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return pagesIn(path);
    return name === 'index.html' ? [`/docs/${relative(GUIDE_DIR, directory).split('\\').join('/')}/`.replace('//', '/')] : [];
  });
}

// The language choice page redirects at once: its own load is covered by every other page.
const pages = pagesIn(GUIDE_DIR).filter(path => path !== '/docs/').sort();

function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(`${page.url()}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') problems.push(`${page.url()}: ${message.text()}`); });
  page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) problems.push(`${response.status()} ${response.url()}`); });
  return problems;
}

test.describe('every Guide page', () => {
  test('there are pages to check', () => {
    expect(pages.length).toBeGreaterThan(100);
  });

  for (let batch = 0; batch < BATCHES; batch++) {
    test(`loads and hydrates without error, batch ${batch + 1}/${BATCHES}`, async ({ page }) => {
      const problems = collectProblems(page);
      for (const path of pages.filter((_, index) => index % BATCHES === batch)) {
        await page.goto(path);
        await expect(page.locator('main h1, main .codex-entry-name').first()).toBeVisible();
        await page.waitForLoadState('networkidle');
      }
      expect(problems).toEqual([]);
    });
  }
});

test.describe('Guide appearance', () => {
  const VISUAL_PAGES = [
    { name: 'guide-home', path: '/docs/en/' },
    { name: 'guide-codex-entry', path: '/docs/fr/codex/housing/home/' },
    { name: 'guide-mechanics', path: '/docs/en/mechanics/energy/' },
  ];

  for (const colorScheme of ['light', 'dark'] as const) {
    for (const { name, path } of VISUAL_PAGES) {
      test(`${name} in ${colorScheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`${name}-${colorScheme}.png`);
      });
    }
  }
});
