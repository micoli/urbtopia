import { describe, expect, it } from 'vitest';
import { createDoubleTapDetector } from './doubleTap';

describe('createDoubleTapDetector', () => {
  it('detects two taps on the same key within the window', () => {
    let time = 0;
    const tap = createDoubleTapDetector(() => time, 300);
    expect(tap('building:1')).toBe(false);
    time = 200;
    expect(tap('building:1')).toBe(true);
  });

  it('ignores a second tap that is late or on another key', () => {
    let time = 0;
    const tap = createDoubleTapDetector(() => time, 300);
    tap('building:1');
    time = 400;
    expect(tap('building:1')).toBe(false);
    time = 500;
    expect(tap('building:2')).toBe(false);
  });

  it('does not chain a third tap into a second double tap', () => {
    let time = 0;
    const tap = createDoubleTapDetector(() => time, 300);
    tap('building:1');
    time = 100;
    tap('building:1');
    time = 150;
    expect(tap('building:1')).toBe(false);
  });

  it('forgets the last tap on a tap with no key', () => {
    let time = 0;
    const tap = createDoubleTapDetector(() => time, 300);
    tap('building:1');
    tap(null);
    time = 100;
    expect(tap('building:1')).toBe(false);
  });
});
