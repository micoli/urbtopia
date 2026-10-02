import { describe, expect, it } from 'vitest';
import { newGame } from './index';

const NOW = 1_700_000_000_000;

describe('newGame', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: NOW });

  it('starts with 600 Urbs', () => {
    expect(state.urbs).toBe(600);
  });

  it('owns the central 2x2 Parcels of the 8x8 map', () => {
    expect(state.ownedParcels).toEqual([
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ]);
  });

  it('pre-places one Workshop and one Factory inside owned Parcels', () => {
    const types = state.buildings.map((b) => b.type).sort();
    expect(types).toEqual(['factory', 'workshop']);
    for (const b of state.buildings) {
      expect(b.x).toBeGreaterThanOrEqual(48);
      expect(b.x).toBeLessThan(80);
      expect(b.y).toBeGreaterThanOrEqual(48);
      expect(b.y).toBeLessThan(80);
    }
  });

  it('records the Seed and the starting time', () => {
    expect(state.seed).toBe('amber-fox-4821');
    expect(state.lastSeen).toBe(NOW);
  });

  it('is deterministic for a given Seed', () => {
    expect(newGame({ seed: 'amber-fox-4821', now: NOW })).toEqual(state);
  });

  it('survives a JSON round trip unchanged', () => {
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
