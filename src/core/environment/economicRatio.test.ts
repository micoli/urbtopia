import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createBuilding, energyStats, newGame, type Building, type GameState } from '../index';

const building = (id: number, type: Building['type'], x: number, tier = 1): Building => ({ ...createBuilding(id, type, x, 0, 0), tier });
const city = (buildings: Building[]): GameState => ({
  ...newGame({ seed: 'ratio', now: 0 }), buildings, nextId: 100, urbs: 10000, tutorial: null, roads: [], adaptationUntil: 0,
});

describe('economic ratio', () => {
  it('stays at 1 when the grid covers every economic building, whatever the float rounding', () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom('shopFood', 'shopEquipment', 'workshop', 'factory', 'office'), { minLength: 1, maxLength: 12 }),
      fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 12, maxLength: 12 }),
      (types, tiers) => {
        const shops = types.map((type, i) => building(i + 1, type as Building['type'], i * 2, tiers[i]));
        const schools = [building(60, 'school', 30, 5), building(61, 'middleSchool', 32, 4), building(62, 'highSchool', 34, 3)];
        const plants = [building(50, 'geothermalPlant', 40, 3), building(51, 'geothermalPlant', 42, 3), building(52, 'geothermalPlant', 44, 3)];
        const stats = energyStats(city([...shops, ...schools, ...plants]));
        if (stats.unmet === 0) expect(stats.economicRatio).toBe(1);
      },
    ));
  });
});
