import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOUBLE_CLICK_MS, singleOrDoubleClick } from './singleOrDoubleClick';

describe('singleOrDoubleClick', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs the single action once the double-click window has passed', () => {
    const single = vi.fn();
    const double = vi.fn();
    const { click } = singleOrDoubleClick(single, double);
    click();
    expect(single).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DOUBLE_CLICK_MS);
    expect(single).toHaveBeenCalledTimes(1);
    expect(double).not.toHaveBeenCalled();
  });

  it('runs only the double action on a second click inside the window', () => {
    const single = vi.fn();
    const double = vi.fn();
    const { click } = singleOrDoubleClick(single, double);
    click();
    vi.advanceTimersByTime(DOUBLE_CLICK_MS - 1);
    click();
    vi.advanceTimersByTime(DOUBLE_CLICK_MS * 2);
    expect(double).toHaveBeenCalledTimes(1);
    expect(single).not.toHaveBeenCalled();
  });

  it('runs the single action at once when there is no double action', () => {
    const single = vi.fn();
    singleOrDoubleClick(single, undefined).click();
    expect(single).toHaveBeenCalledTimes(1);
  });

  it('drops a pending click on dispose', () => {
    const single = vi.fn();
    const handler = singleOrDoubleClick(single, vi.fn());
    handler.click();
    handler.dispose();
    vi.advanceTimersByTime(DOUBLE_CLICK_MS * 2);
    expect(single).not.toHaveBeenCalled();
  });
});
