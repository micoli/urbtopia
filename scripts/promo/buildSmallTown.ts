import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// Builds `states/small-town.json`: the Workshop, Factory and road of a new game, a Storehouse and three Homes, with the Urbs and the Goods the `start` scenario spends.
const BASE_URL = process.env.PROMO_URL ?? 'http://127.0.0.1:5175';
const OUTPUT = join(import.meta.dirname, 'states/small-town.json');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 768 } });
await page.goto(`${BASE_URL}/?promo`);
await page.locator('#splash').waitFor({ state: 'detached', timeout: 60_000 });
await page.waitForFunction(() => window.__promo !== undefined);

const text = await page.evaluate(async () => {
  const store = window.__gameStore!;
  const envelopeModule = '/src/persistence/envelope.ts';
  const { serializeEnvelope } = await import(/* @vite-ignore */ envelopeModule) as typeof import('../../src/persistence/envelope.ts');
  const send = (command: Record<string, unknown>) => {
    store.getState().send(command as never);
    const error = store.getState().lastError;
    if (error) throw new Error(`${JSON.stringify(command)}: ${JSON.stringify(error)}`);
  };
  store.getState().replaceState({ ...store.getState().state, urbs: 100_000 });
  send({ type: 'PlaceBuilding', buildingType: 'waterTower', x: 64, y: 56 });
  send({ type: 'PlaceBuilding', buildingType: 'storehouse', x: 57, y: 56 });
  for (const x of [53, 55, 57]) send({ type: 'PlaceBuilding', buildingType: 'home', x, y: 59 });
  const state = store.getState().state;
  store.getState().replaceState({ ...state, urbs: 3_000_000, storage: { ...state.storage, materials: { ...state.storage.materials, wood: 600, stone: 300 }, goods: { ...state.storage.goods, planks: 1500, bricks: 1500, tiles: 1000, tools: 300 } } });
  return serializeEnvelope(store.getState().state, Date.now());
});

writeFileSync(OUTPUT, text);
await browser.close();
console.log(OUTPUT);
