import { describe, expect, it } from 'vitest';
import { isFpsOverlayRequested } from './fpsOverlay';

describe('isFpsOverlayRequested', () => {
  it('is on when the fps parameter is present', () => {
    expect(isFpsOverlayRequested('?fps')).toBe(true);
    expect(isFpsOverlayRequested('?a=1&fps=1')).toBe(true);
  });

  it('is off otherwise', () => {
    expect(isFpsOverlayRequested('')).toBe(false);
    expect(isFpsOverlayRequested('?lang=fr')).toBe(false);
  });
});
