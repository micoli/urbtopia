import { describe, expect, it } from 'vitest';
import type { FixtureId, Rotation, VenueFixture } from '../index';
import { NO_RECYCLING, recyclingGainsOf, recyclingLimitsOf } from './recyclingGains';
import { collectionDistanceOf } from '../waste/waste';
import { wasteCapacity } from '../waste/wasteBalance';
import { createBuilding, dispatch, newGame, type Command } from '../index';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id: nextId++, type, x, y, rotation });

// A Shaft and a Motor bring the Drive in to the right of a Machine at (x, y).
const driven = (type: FixtureId, x: number, y: number): VenueFixture[] => [put(type, x, y), put('recyclingPlantShaft', x + 1, y, 1), put('recyclingPlantMotor', x + 2, y, 1)];

// Machines down column 1 from the Intake against the back wall, then a Conveyor and an Exit on the front edge of a room of `size` tiles.
const line = (machines: FixtureId[], size = 8): VenueFixture[] => [
  ...machines.flatMap((type, y) => driven(type, 1, y)),
  ...Array.from({ length: size - 1 - machines.length }, (_, k) => put('recyclingPlantConveyor', 1, machines.length + k)),
  put('recyclingPlantExit', 1, size - 1, 2),
];

const plant = (fixtures: VenueFixture[], tier = 4) => ({ ...createBuilding(1, 'recyclingPlant', 0, 0, 0), tier, interior: { fixtures, nextFixtureId: 100 } });

describe('the Recycling lines of a Recycling interior', () => {
  it('add nothing while the room is empty', () => {
    expect(recyclingGainsOf(plant([]))).toEqual(NO_RECYCLING);
  });

  it('count an Exit and a Recycler once the line goes Intake, Sorter, Recycler, Exit', () => {
    const gains = recyclingGainsOf(plant(line(['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder'])));
    expect(gains).toMatchObject({ exits: 1, recyclers: 1, kinds: 1, capacity: 50, collectionDistance: 1.5 });
  });

  it('count nothing without a Sorter', () => {
    expect(recyclingGainsOf(plant(line(['recyclingPlantIntake', 'recyclingPlantShredder'])))).toEqual(NO_RECYCLING);
  });

  it('count nothing when the Recycler comes before the Sorter', () => {
    expect(recyclingGainsOf(plant(line(['recyclingPlantIntake', 'recyclingPlantShredder', 'recyclingPlantSorter'])))).toEqual(NO_RECYCLING);
  });

  it('count nothing without a Recycler', () => {
    expect(recyclingGainsOf(plant(line(['recyclingPlantIntake', 'recyclingPlantSorter'])))).toEqual(NO_RECYCLING);
  });

  it('count nothing when a Machine of the line has no Drive', () => {
    const fixtures = line(['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder']);
    const sorterMotor = fixtures.find(fixture => fixture.type === 'recyclingPlantMotor' && fixture.y === 1)!;
    expect(recyclingGainsOf(plant(fixtures.filter(fixture => fixture !== sorterMotor)))).toEqual(NO_RECYCLING);
  });

  it('count nothing when a Machine of the line is broken down', () => {
    const fixtures = line(['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder']).map(fixture => (fixture.type === 'recyclingPlantSorter' ? { ...fixture, broken: true as const } : fixture));
    expect(recyclingGainsOf(plant(fixtures))).toEqual(NO_RECYCLING);
  });

  it('add the bonus of the three kinds of Recycler only when all three are on a complete line', () => {
    const two = recyclingGainsOf(plant(line(['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder', 'recyclingPlantFurnace'])));
    expect(two).toMatchObject({ kinds: 2, recyclers: 2, capacity: 50, collectionDistance: 3 });
    const three = recyclingGainsOf(plant(line(['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder', 'recyclingPlantFurnace', 'recyclingPlantCrusher'])));
    expect(three).toMatchObject({ kinds: 3, recyclers: 3, capacity: 250, collectionDistance: 4.5 });
  });

  it('are served by the left-handed Machines as well', () => {
    const left: VenueFixture[] = [
      put('recyclingPlantIntakeLeft', 4, 0), put('recyclingPlantShaft', 3, 0, 3), put('recyclingPlantMotor', 2, 0, 3),
      put('recyclingPlantSorterLeft', 4, 1), put('recyclingPlantShaft', 3, 1, 3), put('recyclingPlantMotor', 2, 1, 3),
      put('recyclingPlantCrusherLeft', 4, 2), put('recyclingPlantShaft', 3, 2, 3), put('recyclingPlantMotor', 2, 2, 3),
      put('recyclingPlantConveyor', 4, 3), put('recyclingPlantExit', 4, 4, 2),
    ];
    expect(recyclingGainsOf(plant(left, 1))).toMatchObject({ exits: 1, recyclers: 1 });
  });
});

describe('the Waste figures of a Recycling plant', () => {
  const complete = plant(line(['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder', 'recyclingPlantFurnace', 'recyclingPlantCrusher']));

  it('keep the Collection distance of the kind, plus 1.5 tiles for each Recycler, in whole tiles', () => {
    expect(collectionDistanceOf(plant([]), 'recyclingPlant')).toBe(50);
    expect(collectionDistanceOf(complete, 'recyclingPlant')).toBe(54);
  });

  it('add the capacity of the Exits to the capacity of the Tier', () => {
    expect(wasteCapacity('recyclingPlant', complete.tier) + recyclingGainsOf(complete).capacity).toBe(wasteCapacity('recyclingPlant', complete.tier) + 250);
  });

  it('limit the Exits, Sorters and Recyclers by Tier', () => {
    expect([1, 2, 3, 4].map(tier => recyclingLimitsOf(tier))).toEqual([
      { exits: 1, sorters: 1, recyclers: 2 },
      { exits: 2, sorters: 2, recyclers: 3 },
      { exits: 3, sorters: 3, recyclers: 4 },
      { exits: 4, sorters: 4, recyclers: 6 },
    ]);
  });
});

describe('placing Fixtures in a Recycling interior', () => {
  const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
  const city = () => ({ ...newGame({ seed: 'recycling-interior', now: 0 }), urbs: 100_000, tutorial: null, buildings: [{ ...createBuilding(1, 'recyclingPlant', 5, 5, 0), tier: 1 }] });

  it('refuses a second Collection exit at Tier 1 with a message of its own', () => {
    const first = dispatch(city(), place('recyclingPlantExit', 0, 4, 2), 0);
    if (!first.ok) throw new Error(first.error.key);
    const second = dispatch(first.state, place('recyclingPlantExit', 2, 4, 2), 0);
    expect(second.ok ? null : second.error.key).toBe('error.recyclingLimitReached');
  });
});
