import { afterEach, describe, expect, it, vi } from 'vitest';
import { navButtonAt } from './navButtonAt';

function fakeButton(left: number, top: number, disabled = false): HTMLButtonElement {
  return { disabled, getBoundingClientRect: () => ({ left, right: left + 60, top, bottom: top + 40 }) } as unknown as HTMLButtonElement;
}

afterEach(() => vi.unstubAllGlobals());

describe('navButtonAt', () => {
  it('finds the navigation button under a point, and none elsewhere', () => {
    const build = fakeButton(4, 100);
    const land = fakeButton(4, 160);
    vi.stubGlobal('document', { querySelectorAll: () => [build, land] });
    expect(navButtonAt(30, 120)).toBe(build);
    expect(navButtonAt(30, 170)).toBe(land);
    expect(navButtonAt(500, 120)).toBeUndefined();
  });

  it('skips a disabled button', () => {
    vi.stubGlobal('document', { querySelectorAll: () => [fakeButton(4, 100, true)] });
    expect(navButtonAt(30, 120)).toBeUndefined();
  });
});
