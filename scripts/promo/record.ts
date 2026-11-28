import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { Stage, type Cue } from './stage.ts';
import { DEFAULT_VOICES } from './voice.ts';
import { DEFAULT_VIEWPORT, type Scene } from './types.ts';

export interface Recording {
  video: string;
  trimSeconds: number;
  cues: Cue[];
  viewport: { width: number; height: number };
  // The state of the game when the scene ended: the next scene of the film starts from it.
  endState: string;
}

interface RecordOptions {
  baseUrl: string;
  root: string;
  directory: string;
  hash: string;
  fast: boolean;
  // The state the scene starts from when it goes on from the previous one.
  startState?: string;
  captionLog: Set<string>;
}

// Playwright films from the creation of the page: what comes before the scene starts is trimmed at assembly.
export async function recordScene(scene: Scene, { baseUrl, root, directory, hash, fast, startState, captionLog }: RecordOptions): Promise<Recording> {
  const viewport = scene.options.viewport ?? DEFAULT_VIEWPORT;
  mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch({ headless: false, args: ['--force-device-scale-factor=1'] });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ...(fast ? {} : { recordVideo: { dir: directory, size: viewport } }) });
  const language = scene.options.language ?? 'en';
  const prefs = { language, layout: 'C', pedestrianModel: 'avatar', ...(scene.options.hideTaxBadges ? { showTaxBadges: false } : {}) };
  await context.addInitScript((value) => localStorage.setItem('urbtopia-prefs', JSON.stringify(value)), prefs);
  // Features that ship switched off, switched on for the scene (`flags: ['clubs']`).
  const flags = Object.fromEntries((scene.options.flags ?? []).map((flag) => [flag, true]));
  await context.addInitScript((value) => localStorage.setItem('urbtopia-flags', JSON.stringify(value)), flags);
  const page = await context.newPage();
  const videoStartedAt = Date.now();
  if (process.env.PROMO_DEBUG) page.on('console', (message) => console.log(`[page] ${message.text()}`));
  const time = scene.options.time ? `&time=${scene.options.time}` : '';
  await page.goto(`${baseUrl}/?promo${time}`);
  await page.locator('#splash').waitFor({ state: 'detached', timeout: 60_000 });
  await page.waitForFunction(() => window.__promo !== undefined);
  const initialState = startState ?? (scene.options.state ? readFileSync(join(root, scene.options.state), 'utf8') : undefined);
  if (initialState) {
    const loaded = await page.evaluate((text) => window.__promo?.loadState(text), initialState);
    if (!loaded) throw new Error(`The state ${startState ? 'of the previous scene' : scene.options.state} could not be loaded`);
  }
  await page.evaluate((parts) => window.__promo?.setUi(parts), scene.options.ui ?? []);
  await page.waitForTimeout(1500);
  const readySeconds = (Date.now() - videoStartedAt) / 1000;
  const stage = new Stage(page, { voice: scene.options.voice ?? DEFAULT_VOICES[language], language, viewport, videoStartedAt, captionLog });
  try {
    await scene.play(process.env.PROMO_TRACE ? traced(stage) : stage);
  } catch (error) {
    await page.screenshot({ path: join(directory, `${scene.name}.error.png`) });
    await browser.close();
    throw error;
  }
  if (process.env.PROMO_DEBUG) console.log(await page.evaluate(() => JSON.stringify(window.__gameStore?.getState().state.buildings.find((building) => building.type === 'workshop')?.interior)));
  await page.waitForTimeout(300);
  const endState = await page.evaluate(async () => {
    const envelopeModule = '/src/persistence/envelope.ts';
    const { serializeEnvelope } = await import(/* @vite-ignore */ envelopeModule) as typeof import('../../src/persistence/envelope.ts');
    return serializeEnvelope(window.__gameStore!.getState().state, Date.now());
  });
  // A scene that loaded something behind the scenes marks where its film really starts with `stage.begin()`.
  const trimSeconds = stage.beganAt ?? readySeconds;
  const raw = await page.video()?.path();
  await context.close();
  await browser.close();
  if (fast) return { video: '', trimSeconds, cues: [], viewport, endState };
  if (!raw) throw new Error('No video was recorded');
  const video = join(directory, `${scene.name}.${hash}.webm`);
  renameSync(raw, video);
  writeFileSync(`${video}.json`, JSON.stringify({ trimSeconds, cues: stage.cues, viewport }));
  writeFileSync(`${video}.state.json`, endState);
  return { video, trimSeconds, cues: stage.cues, viewport, endState };
}

// PROMO_TRACE=1 prints how long every verb of the stage takes, to find what makes a scenario slow.
function traced(stage: Stage): Stage {
  return new Proxy(stage, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return async (...args: unknown[]) => {
        const started = Date.now();
        const result = await value.apply(target, args);
        console.log(`${String(property)} ${Date.now() - started}ms`);
        return result;
      };
    },
  });
}
