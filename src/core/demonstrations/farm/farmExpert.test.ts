import { describe, expect, it } from 'vitest';
import { compileDemonstration } from '../scenario';
import { farmExpert } from './farmExpert';

// The layout of a Tier 5 Farm interior that a player built: what the demonstration must end on.
const SCHEMA: readonly (readonly [string, number, number, number])[] = [
  ['farmTank', 0, 8, 2], ['farmIntake', 1, 0, 0], ['farmThresher', 1, 2, 0], ['farmGrader', 1, 3, 0], ['farmWasherLeft', 1, 1, 0], ['farmMotor', 8, 7, 1], ['farmPipe', 0, 4, 0], ['farmPipe', 0, 3, 0],
  ['farmPipeElbow', 0, 1, 0], ['farmPipe', 1, 6, 1], ['farmPumpLeft', 0, 7, 2], ['farmHarvestBin', 1, 5, 2], ['farmPipe', 0, 5, 0], ['farmPipeTee', 0, 6, 3], ['farmSprinkler', 5, 5, 1], ['farmConveyor', 2, 4, 3],
  ['farmPipe', 0, 2, 0], ['farmPipeTee', 5, 6, 2], ['farmShaft', 1, 7, 1], ['farmShaft', 2, 7, 1], ['farmShaft', 3, 7, 1], ['farmShaft', 7, 5, 2], ['farmShaft', 7, 6, 2], ['farmShaft', 3, 3, 1],
  ['farmBevelTee', 7, 7, 2], ['farmBevel', 7, 3, 1], ['farmBevel', 2, 2, 1], ['farmBevelTee', 2, 3, 2], ['farmPipeElbow', 6, 6, 2], ['farmSprinkler', 6, 5, 1], ['farmShaft', 4, 7, 1], ['farmShaft', 5, 7, 1],
  ['farmShaft', 6, 7, 1], ['farmShaft', 4, 3, 1], ['farmShaft', 5, 3, 1], ['farmShaft', 6, 3, 1], ['farmShaft', 7, 4, 0], ['farmConveyorSplitStraightRight', 1, 4, 0], ['farmConveyorElbowRight', 3, 4, 3],
  ['farmHarvestBin', 3, 5, 2], ['farmPipe', 2, 6, 1], ['farmPipe', 3, 6, 1], ['farmPipe', 4, 6, 1],
];

const key = ([type, x, y, rotation]: readonly [string, number, number, number]) => `${type}@${x},${y}/${rotation}`;

describe('the expert Farm demonstration', () => {
  const checkpoints = compileDemonstration(farmExpert);
  const final = checkpoints.at(-1)!.state;
  const farm = final.buildings.find(building => building.id === farmExpert.buildingId)!;

  it('ends on the layout of the schema, piece for piece', () => {
    const built = farm.interior!.fixtures.map(fixture => key([fixture.type, fixture.x, fixture.y, fixture.rotation])).sort();
    expect(built).toEqual(SCHEMA.map(key).sort());
  });

  it('ends with the staff of the schema, and the crops picked on the two bins', () => {
    expect(farm.tier).toBe(5);
    expect(farm.interior!.staff).toMatchObject({ farmhand: 3, irrigator: 4 });
    expect(farm.interior!.technicians).toBe(1);
    const bins = farm.interior!.fixtures.filter(fixture => fixture.type === 'farmHarvestBin');
    expect(bins.map(bin => [bin.x, bin.y, bin.assigned, bin.recipe])).toEqual([[1, 5, true, 'flower'], [3, 5, true, 'wheat']]);
    expect(farm.interior!.fixtures.filter(fixture => fixture.type === 'farmSprinkler').every(sprinkler => sprinkler.assigned === true)).toBe(true);
  });
});
