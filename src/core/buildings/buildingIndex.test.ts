import { describe, expect, it } from 'vitest';
import { buildingsOfType, layoutOf } from './buildingIndex';
import { createBuilding } from './buildingSpecs';

const city = [createBuilding(1, 'home', 2, 2, 0), createBuilding(2, 'school', 6, 2, 0), createBuilding(3, 'home', 10, 2, 0)];

describe('Building index', () => {
  it('lists the buildings of a type in their order', () => {
    expect(buildingsOfType(city, 'home').map(({ id }) => id)).toEqual([1, 3]);
    expect(buildingsOfType(city, 'hospital')).toEqual([]);
  });

  it('keeps the layout while buildings only change what they hold', () => {
    const before = layoutOf(city);
    expect(layoutOf(city.map(building => ({ ...building, collected: true })))).toBe(before);
  });

  it('changes the layout when a building is upgraded, moved or removed', () => {
    const before = layoutOf(city);
    expect(layoutOf(city.map(building => building.id === 1 ? { ...building, tier: 2 } : building))).not.toBe(before);
    expect(layoutOf(city.map(building => building.id === 1 ? { ...building, x: 3 } : building))).not.toBe(before);
    expect(layoutOf(city.slice(1))).not.toBe(before);
  });
});
