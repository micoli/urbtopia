import * as Sentry from '@sentry/react';
import { FrameSampler, installFrameSampler } from './frameSampler';
import { MetricWindow, type MetricAttributes } from './metricWindow';

const FLUSH_INTERVAL_MS = 60_000;
const SMALL_CITY_BUILDINGS = 50;
const MEDIUM_CITY_BUILDINGS = 200;

const tickWindow = new MetricWindow('tick_ms', 'millisecond');
const saveWindow = new MetricWindow('save_ms', 'millisecond');
let describe: () => MetricAttributes = () => ({});

export function cityBucket(buildingCount: number): string {
  if (buildingCount < SMALL_CITY_BUILDINGS) return 'small';
  return buildingCount < MEDIUM_CITY_BUILDINGS ? 'medium' : 'large';
}

export function measureTick(tick: () => void): void {
  const start = performance.now();
  tick();
  tickWindow.add(performance.now() - start);
}

export function measureSave<T>(save: () => T): T {
  const start = performance.now();
  const outcome = save();
  saveWindow.add(performance.now() - start);
  return outcome;
}

export function recordSaveFailure(reason: string): void {
  Sentry.metrics.count('save_failed', 1, { attributes: { ...describe(), reason } });
}

export function recordLoad(kind: string, reason?: string): void {
  Sentry.metrics.count('load_result', 1, { attributes: { ...describe(), kind, reason: reason ?? 'none' } });
}

function flushWindows(): void {
  const attributes = describe();
  tickWindow.flush(attributes);
  saveWindow.flush(attributes);
}

export function setGameAttributes(describeGame: () => MetricAttributes): void {
  describe = describeGame;
}

export function gameAttributes(): MetricAttributes {
  return describe();
}

export function installGameMetrics(): void {
  installFrameSampler(new FrameSampler(gameAttributes));
  setInterval(flushWindows, FLUSH_INTERVAL_MS);
  window.addEventListener('pagehide', flushWindows);
}
