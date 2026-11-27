import type { Locator, Page } from '@playwright/test';
import type { UiPart } from './types.ts';
import { speak } from './voice.ts';

export interface Cue {
  file: string;
  at: number;
  seconds: number;
}

export interface StageOptions {
  voice: string;
  // The moment the video starts, in milliseconds since the epoch: a cue is dated from it.
  videoStartedAt: number;
}

type Target = Locator | { role: Parameters<Page['getByRole']>[0]; name: string | RegExp };

// `--fast` runs a scenario to test it: no pause, no travel of the cursor, a short camera and time-lapse.
// Read when used, not at import: the command line sets it after the modules are loaded.
const isFast = (): boolean => process.env.PROMO_FAST === '1';
const FRAME_MS = 16;
const PAUSE_AFTER_LINE_MS = 250;
const ease = (t: number) => t * t * (3 - 2 * t);

export class Stage {
  private pointer = { x: 0, y: 0 };
  readonly page: Page;
  // True under `--fast`: a scenario can skip what is only there to look good.
  get fast(): boolean {
    return isFast();
  }

  readonly cues: Cue[] = [];
  private readonly options: StageOptions;
  private speaksUntil = 0;

  constructor(page: Page, options: StageOptions) {
    this.page = page;
    this.options = options;
  }

  wait(milliseconds: number): Promise<void> {
    return this.page.waitForTimeout(isFast() ? Math.min(milliseconds, 30) : milliseconds);
  }

  async caption(text: string, milliseconds?: number, mode: 'plain' | 'words' | 'typewriter' = 'plain'): Promise<void> {
    await this.page.evaluate(([value, style]) => window.__promo?.caption(value, style), [text, mode] as const);
    if (milliseconds === undefined) return;
    await this.wait(milliseconds);
    await this.hideCaption();
  }

  hideCaption(): Promise<void> {
    return this.page.evaluate(() => window.__promo?.caption(null));
  }

  async move(x: number, y: number, milliseconds = 700): Promise<void> {
    if (isFast()) {
      await this.page.mouse.move(x, y);
      this.pointer = { x, y };
      return;
    }
    const from = this.pointer;
    const start = Date.now();
    for (let elapsed = 0; elapsed < milliseconds; elapsed = Date.now() - start) {
      const t = ease(elapsed / milliseconds);
      await this.page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
      await this.wait(FRAME_MS);
    }
    await this.page.mouse.move(x, y);
    this.pointer = { x, y };
  }

  private async boxOf(target: Target): Promise<{ x: number; y: number; width: number; height: number }> {
    const locator = 'role' in target ? this.page.getByRole(target.role, { name: target.name }) : target;
    const box = await locator.boundingBox();
    if (!box) throw new Error(`Nothing to show: ${locator}`);
    return box;
  }

  // The voice over says a line. A line never overlaps the previous one: it waits for it to end. With `wait: false` the scene goes on while the voice speaks.
  async say(text: string, { wait = true, speed = 1 } = {}): Promise<void> {
    if (isFast()) return;
    const speech = await speak(text, this.options.voice, speed);
    const startsAt = Math.max(Date.now(), this.speaksUntil);
    this.speaksUntil = startsAt + speech.seconds * 1000 + PAUSE_AFTER_LINE_MS;
    this.cues.push({ file: speech.file, at: (startsAt - this.options.videoStartedAt) / 1000, seconds: speech.seconds });
    if (wait) await this.page.waitForTimeout(this.speaksUntil - Date.now());
  }

  // Lets the voice finish its last line before the scene ends.
  async endOfSpeech(): Promise<void> {
    if (isFast()) return;
    await this.page.waitForTimeout(Math.max(0, this.speaksUntil - Date.now()));
  }

  // A full-screen title card that fades in and out.
  async title(text: string, { subtitle, seconds = 2.5 }: { subtitle?: string; seconds?: number } = {}): Promise<void> {
    await this.page.evaluate(([a, b]) => window.__promo?.title(a, b), [text, subtitle] as const);
    await this.wait(seconds * 1000);
    await this.page.evaluate(() => window.__promo?.title(null));
  }

  // A spotlight on a widget: the rest of the picture is dimmed, a ring pulses around it. `clearCallout` removes it.
  async callout(target: Target, label?: string): Promise<void> {
    const box = await this.boxOf(target);
    await this.page.evaluate(([rect, text]) => window.__promo?.callout(rect, text), [box, label] as const);
  }

  clearCallout(): Promise<void> {
    return this.page.evaluate(() => window.__promo?.callout(null));
  }

  // A big figure counting up, to land a number.
  stat(label: string, to: number, { from = 0, seconds = 1.6, suffix = '' } = {}): Promise<void> {
    return this.page.evaluate(([a, b, c, d, e]) => window.__promo?.stat(a, b, c, d, e), [label, from, to, isFast() ? 0.05 : seconds, suffix] as const);
  }

  // The cursor goes to a widget and rests on it, to show it.
  async point(target: Target, milliseconds = 700): Promise<void> {
    const box = await this.boxOf(target);
    await this.move(box.x + box.width / 2, box.y + box.height / 2, milliseconds);
  }

  // The cursor draws a loop around a widget, to put it forward.
  async circle(target: Target, { turns = 1.25, milliseconds = 1400, margin = 14 } = {}): Promise<void> {
    if (isFast()) return this.point(target);
    const box = await this.boxOf(target);
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const radius = { x: box.width / 2 + margin, y: box.height / 2 + margin };
    await this.move(centre.x + radius.x, centre.y, 500);
    const start = Date.now();
    for (let elapsed = 0; elapsed < milliseconds; elapsed = Date.now() - start) {
      const angle = (elapsed / milliseconds) * turns * 2 * Math.PI;
      await this.page.mouse.move(centre.x + Math.cos(angle) * radius.x, centre.y + Math.sin(angle) * radius.y);
      await this.wait(FRAME_MS);
    }
    this.pointer = { x: centre.x + Math.cos(turns * 2 * Math.PI) * radius.x, y: centre.y + Math.sin(turns * 2 * Math.PI) * radius.y };
  }

  async click(target: Target): Promise<void> {
    const locator = 'role' in target ? this.page.getByRole(target.role, { name: target.name }) : target;
    const box = await locator.boundingBox();
    if (!box) throw new Error(`Nothing to click on: ${locator}`);
    await this.clickAt(box.x + box.width / 2, box.y + box.height / 2);
  }

  async clickAt(x: number, y: number): Promise<void> {
    await this.move(x, y);
    await this.page.mouse.down();
    await this.wait(80);
    await this.page.mouse.up();
  }

  ui(...parts: UiPart[]): Promise<void> {
    return this.page.evaluate((value) => window.__promo?.setUi(value), parts);
  }

  // Runs a block that is only there to look good (a flourish of the cursor, a long pause, a closing shot); `--fast` skips it.
  async cinematic(block: () => Promise<void>): Promise<void> {
    if (isFast()) return;
    await block();
  }

  // A promo must show a set-up that works: the scene stops, and nothing is assembled, when what it presents is not true.
  async check(description: string, predicate: () => Promise<boolean>): Promise<void> {
    if (!(await predicate())) throw new Error(`Check failed: ${description}`);
  }

  async type(text: string, delay = 90): Promise<void> {
    await this.page.keyboard.type(text, { delay: isFast() ? 0 : delay });
  }

  async clickTile(x: number, y: number): Promise<void> {
    const point = await this.page.evaluate(([a, b]) => window.__promo?.tileToScreen(a, b), [x, y] as const);
    if (!point) throw new Error(`Tile ${x},${y} is not on screen`);
    await this.clickAt(point.x, point.y);
  }

  async drag(from: { x: number; y: number }, to: { x: number; y: number }, milliseconds = 900): Promise<void> {
    await this.move(from.x, from.y);
    await this.page.mouse.down();
    await this.move(to.x, to.y, milliseconds);
    await this.page.mouse.up();
  }

  async zoom(delta: number, steps = 8): Promise<void> {
    for (let step = 0; step < steps; step++) {
      await this.page.mouse.wheel(0, delta / steps);
      await this.wait(60);
    }
  }

  flyTo(x: number, z: number, zoom: number, seconds = 2): Promise<void> {
    return this.page.evaluate(([a, b, c, d]) => window.__promo?.flyTo(a, b, c, d), [x, z, zoom, isFast() ? 0.05 : seconds] as const);
  }

  focusTile(x: number, y: number, zoom: number, seconds = 1.8): Promise<void> {
    return this.flyTo(x + 0.5, y + 0.5, zoom, seconds);
  }

  timelapse({ hours, seconds }: { hours: number; seconds: number }): Promise<void> {
    return this.page.evaluate(([a, b]) => window.__promo?.timelapse(a, b), [hours, isFast() ? 0.3 : seconds] as const);
  }

  skip(hours: number): Promise<void> {
    return this.send({ type: 'SkipTime', hours });
  }

  async send(command: { type: string; [field: string]: unknown }): Promise<void> {
    await this.page.evaluate((value) => window.__gameStore?.getState().send(value as never), command);
  }

  pinCycleHour(hour: number | null): Promise<void> {
    return this.page.evaluate((value) => window.__promo?.pinCycleHour(value), hour);
  }
}
