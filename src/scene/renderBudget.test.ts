import { describe, expect, it } from 'vitest';
import { FrameBudgetMonitor, shouldRenderFrame } from './renderBudget';

describe('shouldRenderFrame', () => {
  it('skips frames that come too early', () => {
    expect(shouldRenderFrame(8)).toBe(false);
    expect(shouldRenderFrame(16.7)).toBe(false);
  });

  it('renders every second frame of a 60 Hz display', () => {
    expect(shouldRenderFrame(33.3)).toBe(true);
  });

  it('renders every fourth frame of a 120 Hz display', () => {
    expect(shouldRenderFrame(25)).toBe(false);
    expect(shouldRenderFrame(33.3)).toBe(true);
  });
});

describe('FrameBudgetMonitor', () => {
  const feed = (monitor: FrameBudgetMonitor, ms: number, count: number) => Array.from({ length: count }, () => monitor.push(ms));

  it('is not slow before it has enough frames', () => {
    const monitor = new FrameBudgetMonitor();
    feed(monitor, 200, 30);
    expect(monitor.isSlow).toBe(false);
  });

  it('stays fast when the device keeps 30 FPS, even with a few long frames', () => {
    const monitor = new FrameBudgetMonitor();
    feed(monitor, 33, 80);
    feed(monitor, 300, 10);
    expect(monitor.isSlow).toBe(false);
  });

  it('is slow when most frames miss the budget', () => {
    const monitor = new FrameBudgetMonitor();
    feed(monitor, 66, 90);
    expect(monitor.isSlow).toBe(true);
  });

  it('forgets the old frames as new ones come, and can reset', () => {
    const monitor = new FrameBudgetMonitor();
    feed(monitor, 66, 90);
    feed(monitor, 33, 90);
    expect(monitor.isSlow).toBe(false);
    feed(monitor, 66, 90);
    monitor.reset();
    expect(monitor.isSlow).toBe(false);
  });
});
