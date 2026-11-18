import { describe, expect, it } from 'vitest';
import { compileDemonstration } from '../scenario';
import { millExpert } from './millExpert';

// The layout of a Tier 5 Mill interior that a player built: what the demonstration must end on.
const SCHEMA: readonly (readonly [string, number, number, number])[] = [
  ['millstone', 5, 0, 3], ['millstone', 5, 2, 3], ['millstone', 5, 4, 3], ['millstone', 5, 6, 3],
  ['millstoneRight', 4, 8, 3], ['millstone', 3, 4, 2], ['millstoneRight', 2, 4, 2],
  ['millCleaner', 2, 2, 3], ['millPumpLeft', 3, 2, 3], ['millPipeElbow', 4, 0, 0], ['millPipe', 4, 1, 0],
  ['millPipeCross', 4, 2, 0], ['millPipe', 4, 3, 2], ['millPipeCross', 4, 4, 0], ['millPipe', 4, 5, 0],
  ['millPipeTee', 4, 6, 2], ['millPipeTee', 3, 6, 0], ['millPipe', 3, 7, 0], ['millPipeElbow', 3, 8, 3],
  ['millPipeElbow', 1, 4, 0], ['millPipe', 1, 5, 0], ['millPipeElbow', 1, 6, 3], ['millPipe', 2, 6, 1],
  ['millBagger', 5, 1, 2], ['millBagger', 5, 3, 2], ['millBagger', 5, 5, 2], ['millOilTank', 3, 5, 2],
  ['millOilTank', 5, 7, 2], ['millOilTank', 4, 7, 0], ['millOilTank', 2, 5, 2],
  ['millMotor', 1, 3, 3], ['millBevelTee', 2, 3, 0], ['millBevelTee', 3, 3, 1], ['millMotorStrong', 7, 0, 1],
  ['millBevel', 6, 0, 1], ['millShaft', 6, 1, 0], ['millBevelCross', 6, 2, 0], ['millBevel', 7, 2, 2],
  ['millShaft', 6, 3, 0], ['millBevelTee', 6, 4, 1], ['millShaft', 6, 5, 0], ['millBevelTee', 6, 6, 1],
  ['millShaft', 6, 7, 0], ['millBevel', 6, 8, 2], ['millShaft', 5, 8, 1],
];

const key = ([type, x, y, rotation]: readonly [string, number, number, number]) => `${type}@${x},${y}/${rotation}`;

describe('the expert Mill demonstration', () => {
  const final = compileDemonstration(millExpert).at(-1)!.state;
  const mill = final.buildings.find(building => building.id === millExpert.buildingId)!;

  it('ends on the layout of the schema, piece for piece', () => {
    const built = mill.interior!.fixtures.map(fixture => key([fixture.type, fixture.x, fixture.y, fixture.rotation])).sort();
    expect(built).toEqual(SCHEMA.map(key).sort());
  });

  it('ends with the staff of the schema, the recipes picked and five millstones assigned', () => {
    expect(mill.tier).toBe(5);
    expect(mill.interior!.staff).toMatchObject({ miller: 5 });
    expect(mill.interior!.technicians).toBe(2);
    const stones = mill.interior!.fixtures.filter(fixture => fixture.type === 'millstone' || fixture.type === 'millstoneRight');
    expect(stones.map(stone => [stone.x, stone.y, stone.recipe, stone.assigned === true])).toEqual([[5, 0, 'oliveOil', true], [5, 2, 'flour', true], [5, 4, 'flour', true], [5, 6, 'oliveOil', true], [4, 8, 'oliveOil', false], [3, 4, 'oliveOil', false], [2, 4, 'oliveOil', true]]);
  });
});
