import { describe, expect, it } from 'vitest';
import { createBuilding, dayCycleOffsetAt, ECOLOGY, newGame, unpoweredBuildingIds, type GameState } from '../index';

const city = (cycleHour: number, extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'powered', now: 0 }), dayCycleOffset: dayCycleOffsetAt(0, cycleHour), tutorial: null, adaptationUntil: 0, urbs: 0,
  buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 3 }, createBuilding(2, 'geothermalPlant', 60, 60, 0)], ...extra,
});

describe('unpowered buildings', () => {
  it('lists a Home that gets less power than it needs', () => {
    const state = city(12, { buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 3 }] });
    expect([...unpoweredBuildingIds(state)]).toEqual([1]);
  });

  it('leaves out a Home that is fully supplied', () => {
    expect(unpoweredBuildingIds(city(12)).has(1)).toBe(false);
  });

  it('never lists a building that needs no power, such as a power plant', () => {
    const state = city(12, { buildings: [createBuilding(2, 'geothermalPlant', 60, 60, 0)] });
    expect(unpoweredBuildingIds(state).size).toBe(0);
  });

  it('lists nothing during an Adaptation period, when a shortage costs nothing', () => {
    const state = city(12, { buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 3 }], adaptationUntil: ECOLOGY.hourMs });
    expect(unpoweredBuildingIds(state).size).toBe(0);
  });

  it('puts a solar-only Home in the dark at Night and not at noon', () => {
    const solar = (cycleHour: number) => city(cycleHour, { buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 1, solar: true }] });
    expect(unpoweredBuildingIds(solar(14)).size).toBe(0);
    expect(unpoweredBuildingIds(solar(2)).has(1)).toBe(true);
  });
});
