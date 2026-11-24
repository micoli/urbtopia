import { expect, test, type Browser, type Page } from '@playwright/test';

async function ready(page: Page) {
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
}

const cloudStatus = (page: Page) => page.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.getState().status.kind);

async function openDevice(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    if (!localStorage.getItem('urbtopia-prefs')) localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
  });
  await page.goto(`/?e2e&local-auth=${email}`);
  await ready(page);
  await expect.poll(() => page.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.getState().actions !== null), { timeout: 20_000 }).toBe(true);
  return page;
}

test('a second device plays read-only until the player takes the City over', async ({ browser }) => {
  test.setTimeout(150_000);
  const email = `devices-${Date.now()}@example.com`;

  const first = await openDevice(browser, email);
  await first.evaluate(async () => (await import('../src/store/cloudStore.ts')).cloudStore.getState().actions?.syncNow());
  await expect.poll(() => cloudStatus(first), { timeout: 20_000 }).toBe('synced');

  const second = await openDevice(browser, email);
  await expect.poll(() => cloudStatus(second), { timeout: 20_000 }).toBe('elsewhere');
  await expect(second.getByRole('alert').filter({ hasText: 'played on another device' })).toBeVisible();

  await second.getByRole('button', { name: 'Play here' }).click();
  await expect.poll(() => cloudStatus(second), { timeout: 20_000 }).toBe('synced');
  await expect(second.getByRole('button', { name: 'Play here' })).toHaveCount(0);

  await expect.poll(() => cloudStatus(first), { timeout: 90_000 }).toBe('elsewhere');
  await expect(first.getByRole('button', { name: 'Play here' })).toBeVisible();
});
