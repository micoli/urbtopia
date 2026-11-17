import { describe, expect, it } from 'vitest';
import { compileDemonstration } from '../scenario';
import { livestockFarmExpert } from './livestockFarmExpert';

// The layout of a Tier 3 Livestock farm interior that a player built: what the demonstration must end on. The player had not yet powered the fourth column: the elbow at (3, 1) is a Shaft here and a Bevel at (3, 0) carries the Drive to the Intake at (4, 0).
const SCHEMA: readonly (readonly [string, number, number, number])[] = [
  ['livestockPen', 0, 2, 0], ['livestockFeedIntake', 0, 0, 0], ['livestockConveyor', 0, 3, 0], ['livestockFeeder', 0, 1, 2], ['livestockCollectionExit', 0, 5, 2], ['livestockPacker', 0, 4, 0],
  ['livestockBevel', 1, 6, 3], ['livestockShaft', 1, 5, 0], ['livestockShaft', 1, 3, 0], ['livestockShaft', 1, 1, 0], ['livestockShaft', 2, 6, 1], ['livestockShaft', 1, 2, 0],
  ['livestockBevelTee', 1, 0, 0], ['livestockFeedIntakeLeft', 2, 0, 0], ['livestockFeeder', 2, 1, 2], ['livestockPen', 2, 2, 0], ['livestockPackerLeft', 2, 4, 0], ['livestockConveyor', 2, 3, 0],
  ['livestockCollectionExit', 2, 5, 2], ['livestockBevelCross', 1, 4, 0], ['livestockMotorStrong', 0, 7, 0], ['livestockCollectionExit', 5, 5, 2], ['livestockPacker', 5, 4, 0], ['livestockPen', 5, 2, 0],
  ['livestockFeedIntake', 5, 0, 0], ['livestockFeeder', 5, 1, 2], ['livestockCollectionExit', 4, 5, 2], ['livestockPackerLeft', 7, 4, 0], ['livestockPen', 7, 2, 0], ['livestockFeeder', 7, 1, 2],
  ['livestockFeedIntakeLeft', 7, 0, 0], ['livestockConveyor', 7, 3, 0], ['livestockBevelCross', 6, 4, 0], ['livestockBevelTee', 6, 0, 0], ['livestockShaft', 6, 3, 0], ['livestockShaft', 6, 2, 0],
  ['livestockShaft', 6, 1, 0], ['livestockShaft', 6, 5, 0], ['livestockBevelCross', 3, 6, 3], ['livestockShaft', 3, 1, 0], ['livestockBevel', 3, 0, 0], ['livestockBevel', 3, 7, 2], ['livestockConveyor', 5, 3, 0],
  ['livestockFeedIntakeLeft', 4, 0, 0], ['livestockConveyor', 4, 3, 0], ['livestockFeeder', 4, 1, 2], ['livestockPen', 4, 2, 0], ['livestockPackerLeft', 4, 4, 0], ['livestockShaft', 4, 6, 1],
  ['livestockBevelTee', 3, 4, 3], ['livestockShaft', 3, 5, 0], ['livestockShaft', 3, 3, 0], ['livestockShaft', 3, 2, 0], ['livestockBevelTee', 5, 6, 0], ['livestockBevel', 5, 7, 3],
  ['livestockMotorStrong', 6, 7, 2], ['livestockBevel', 6, 6, 2], ['livestockShaft', 2, 7, 1], ['livestockCollectionExit', 7, 5, 2],
];

const key = ([type, x, y, rotation]: readonly [string, number, number, number]) => `${type}@${x},${y}/${rotation}`;

describe('the expert Livestock farm demonstration', () => {
  const final = compileDemonstration(livestockFarmExpert).at(-1)!.state;
  const farm = final.buildings.find(building => building.id === livestockFarmExpert.buildingId)!;

  it('ends on the layout of the schema, piece for piece', () => {
    const built = farm.interior!.fixtures.map(fixture => key([fixture.type, fixture.x, fixture.y, fixture.rotation])).sort();
    expect(built).toEqual(SCHEMA.map(key).sort());
  });

  it('ends with the staff of the schema, the products picked and the last exit assigned', () => {
    expect(farm.tier).toBe(3);
    expect(farm.interior!.staff).toMatchObject({ herder: 3 });
    expect(farm.interior!.technicians).toBe(1);
    const pens = farm.interior!.fixtures.filter(fixture => fixture.type === 'livestockPen');
    expect(pens.map(pen => [pen.x, pen.recipe])).toEqual([[0, 'henEgg'], [2, 'duckEgg'], [4, 'milk'], [5, 'wool'], [7, 'silk']]);
    expect(farm.interior!.fixtures.filter(fixture => fixture.assigned === true).map(fixture => [fixture.x, fixture.y])).toEqual([[7, 5]]);
  });
});
