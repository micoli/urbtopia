import { describe, expect, it } from 'vitest';
import { clampToViewport } from './clampToViewport';

const viewport = { width: 1000, height: 600 };
const size = { width: 400, height: 150 };

describe('clampToViewport', () => {
  it('keeps a position that fits', () => {
    expect(clampToViewport({ x: 100, y: 80 }, size, viewport)).toEqual({ x: 100, y: 80 });
  });

  it('keeps the whole window on screen', () => {
    expect(clampToViewport({ x: -50, y: -20 }, size, viewport)).toEqual({ x: 0, y: 0 });
    expect(clampToViewport({ x: 900, y: 590 }, size, viewport)).toEqual({ x: 600, y: 450 });
  });

  it('pins a window larger than the screen to the top left', () => {
    expect(clampToViewport({ x: 30, y: 30 }, { width: 1200, height: 700 }, viewport)).toEqual({ x: 0, y: 0 });
  });
});
