import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// Builds `states/early-city.json`: the first Workshop and Factory of a new game, a Storehouse, a Water tower and ten Homes along the road, with enough Citizens for the Workshop interior.
const BASE_URL = process.env.PROMO_URL ?? 'http://127.0.0.1:5175';
const OUTPUT = join(import.meta.dirname, 'states/early-city.json');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 768 } });
await page.goto(`${BASE_URL}/?promo`);
await page.locator('#splash').waitFor({ state: 'detached', timeout: 60_000 });
await page.waitForFunction(() => window.__promo !== undefined);

const text = await page.evaluate(async () => {
  const store = window.__gameStore!;
  const envelopeModule = '/src/persistence/envelope.ts';
  const { serializeEnvelope } = await import(/* @vite-ignore */ envelopeModule) as typeof import('../../src/persistence/envelope.ts');
  const place = (buildingType: string, x: number, y: number) => {
    store.getState().send({ type: 'PlaceBuilding', buildingType, x, y } as never);
    const error = store.getState().lastError;
    if (error) throw new Error(`${buildingType} ${x},${y}: ${JSON.stringify(error)}`);
  };
  store.getState().replaceState({ ...store.getState().state, urbs: 100_000 });
  place('waterTower', 64, 56);
  place('storehouse', 57, 56);
  for (let x = 53; x <= 62; x++) place('home', x, 59);
  store.getState().replaceState({ ...store.getState().state, urbs: 6000 });
  return serializeEnvelope(store.getState().state, Date.now());
});

writeFileSync(OUTPUT, text);
await browser.close();
console.log(OUTPUT);
