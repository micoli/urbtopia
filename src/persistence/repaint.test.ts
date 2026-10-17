import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type ColorVariant } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';

const T0 = 1_700_000_000_000;

const loads = (building: Building): boolean => parseEnvelope(serializeEnvelope({ ...newGame({ seed: 'repaint-save', now: T0 }), tutorial: null, buildings: [building] }, T0)).ok;

const painted = (type: Building['type'], colorVariant: ColorVariant): Building => ({ ...createBuilding(1, type, 56, 57, 0), colorVariant });

describe('repainted building save', () => {
  it('loads a color the kit offers', () => {
    expect(loads(painted('hotel', 'b'))).toBe(true);
    expect(loads(painted('hotel', 'c'))).toBe(true);
    expect(loads(painted('workshop', 'c'))).toBe(true);
  });

  it('refuses a color on a building that cannot be repainted', () => {
    expect(loads(painted('solar', 'a'))).toBe(false);
  });

  it('keeps loading a Home saved with a color its model never offered', () => {
    expect(loads(painted('home-building', 'c'))).toBe(true);
  });
});
