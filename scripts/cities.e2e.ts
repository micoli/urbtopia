import { expect, test, type Page } from '@playwright/test';

async function registry(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('urbtopia-cities') ?? 'null') as { lastPlayed: string; cities: { id: string; name: string | null }[] });
}

async function openSettings(page: Page) {
  await page.getByRole('button', { name: /Settings/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Cities' })).toBeVisible();
}

test('creates, renames, switches and deletes Cities', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('urbtopia-prefs')) localStorage.setItem('urbtopia-prefs', JSON.stringify({ language: 'en', layout: 'C' }));
  });
  await page.goto('/?bypass-tutorial&keep-local');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  const first = (await registry(page)).lastPlayed;

  await openSettings(page);
  await page.getByRole('button', { name: 'New city' }).click();
  await page.getByRole('radiogroup', { name: 'Difficulty of the new city' }).getByRole('radio', { name: 'Easy' }).click();
  await page.getByRole('button', { name: 'New city' }).click();
  await page.waitForLoadState('load');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });

  const afterCreate = await registry(page);
  expect(afterCreate.cities).toHaveLength(2);
  expect(afterCreate.lastPlayed).not.toBe(first);
  expect(await page.evaluate(async () => (await import('../src/store/gameStore.ts')).gameStore.getState().state.difficulty)).toBe('easy');

  await openSettings(page);
  const nameInput = page.getByLabel('City name').first();
  await nameInput.fill('Second Town');
  await page.getByRole('button', { name: 'Rename' }).first().click();
  expect((await registry(page)).cities.map((city) => city.name)).toContain('Second Town');
  await page.getByLabel('City name').nth(1).fill('second town');
  await page.getByRole('button', { name: 'Rename' }).nth(1).click();
  await expect(page.getByText('You already have a city with this name.')).toBeVisible();

  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.waitForLoadState('load');
  await expect(page.locator('#splash')).toHaveCount(0, { timeout: 30_000 });
  expect((await registry(page)).lastPlayed).toBe(first);

  await openSettings(page);
  const secondRow = page.locator('.city-row').nth(1);
  await secondRow.getByRole('button', { name: 'Delete', exact: true }).click();
  const secondName = (await registry(page)).cities[1]?.name ?? '';
  await secondRow.getByLabel('City name').last().fill(secondName);
  await secondRow.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.city-row')).toHaveCount(1);
  expect((await registry(page)).cities).toHaveLength(1);
  await expect(page.getByText('The last city cannot be deleted.')).toBeVisible();
});
