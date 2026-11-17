import { describe, expect, it } from 'vitest';
import { compileDemonstration } from './scenario';
import { bakeryExpert } from './bakeryExpert';

// The layout of a Tier 5 Bakery interior that a player built: what the demonstration must end on.
const SCHEMA: readonly (readonly [string, number, number, number])[] = [
  ['bakeryCounter', 4, 6, 2], ['bakeryCounter', 2, 6, 2], ['bakeryOven', 3, 4, 0], ['bakeryCounter', 6, 6, 2], ['bakeryWall', 5, 6, 0], ['bakeryCounter', 9, 6, 2], ['bakeryMixer', 0, 0, 0], ['bakeryConveyor', 0, 1, 0],
  ['bakeryCounter', 0, 6, 2], ['bakeryOvenRight', 0, 4, 0], ['bakeryMotor', 1, 1, 3], ['bakeryTank', 1, 2, 0], ['bakeryBevel', 2, 3, 2], ['bakeryShaft', 2, 2, 2], ['bakeryConveyor', 0, 3, 0], ['bakeryConveyorElbowLeft', 2, 5, 1],
  ['bakeryConveyor', 9, 5, 0], ['bakeryWall', 1, 6, 0], ['bakeryWall', 3, 6, 0], ['bakeryWall', 7, 6, 0], ['bakeryWall', 8, 6, 0], ['bakeryConveyor', 0, 5, 0], ['bakeryPipeTee', 1, 4, 2], ['bakeryConveyor', 3, 2, 0],
  ['bakeryPipe', 2, 4, 1], ['bakeryMixerLeft', 4, 0, 0], ['bakeryConveyor', 0, 2, 0], ['bakeryOvenRight', 6, 4, 0], ['bakeryMotor', 7, 1, 3], ['bakeryPump', 7, 3, 0], ['bakeryTank', 7, 2, 0], ['bakeryPipe', 8, 4, 1],
  ['bakeryConveyor', 6, 5, 0], ['bakeryOven', 9, 4, 0], ['bakeryPipeTee', 7, 4, 2], ['bakeryConveyor', 9, 2, 0], ['bakeryConveyor', 9, 1, 0], ['bakeryBevel', 8, 3, 2], ['bakeryConveyorElbowLeft', 3, 1, 1], ['bakeryConveyorElbowRight', 4, 1, 0],
  ['bakeryConveyorSplit', 3, 5, 0], ['bakeryConveyorElbowRight', 4, 5, 3], ['bakeryPump', 1, 3, 0], ['bakeryBevelTee', 2, 0, 0], ['bakeryConveyor', 3, 3, 0], ['bakeryMixerLeft', 9, 0, 0], ['bakeryBevelTee', 8, 1, 1], ['bakeryMixer', 6, 0, 0],
  ['bakeryConveyor', 6, 3, 0], ['bakeryConveyor', 6, 2, 0], ['bakeryConveyor', 6, 1, 0], ['bakeryConveyor', 9, 3, 0], ['bakeryBevelTee', 8, 0, 0], ['bakeryShaft', 7, 0, 1], ['bakeryShaft', 1, 0, 1], ['bakeryShaft', 3, 0, 1],
  ['bakeryShaft', 8, 2, 0], ['bakeryBevelTee', 2, 1, 1],
];

const key = ([type, x, y, rotation]: readonly [string, number, number, number]) => `${type}@${x},${y}/${rotation}`;

describe('the expert Bakery demonstration', () => {
  const final = compileDemonstration(bakeryExpert).at(-1)!.state;
  const bakery = final.buildings.find(building => building.id === bakeryExpert.buildingId)!;

  it('ends on the layout of the schema, piece for piece', () => {
    const built = bakery.interior!.fixtures.map(fixture => key([fixture.type, fixture.x, fixture.y, fixture.rotation])).sort();
    expect(built).toEqual(SCHEMA.map(key).sort());
  });

  it('ends with the staff of the schema, the recipes picked and the Ovens assigned', () => {
    expect(bakery.tier).toBe(5);
    expect(bakery.interior!.staff).toMatchObject({ baker: 4, seller: 5 });
    expect(bakery.interior!.technicians).toBe(2);
    const ovens = bakery.interior!.fixtures.filter(fixture => fixture.type === 'bakeryOven' || fixture.type === 'bakeryOvenRight');
    expect(ovens.map(oven => [oven.x, oven.recipe, oven.assigned])).toEqual([[0, 'cherryClafoutis', true], [3, 'bread', true], [6, 'appleCake', true], [9, 'appleCake', true]]);
    const counters = bakery.interior!.fixtures.filter(fixture => fixture.type === 'bakeryCounter');
    expect(counters.map(counter => [counter.x, counter.soldGood])).toEqual([[0, 'cherryClafoutis'], [2, 'bread'], [4, 'bread'], [6, 'appleCake'], [9, 'appleCake']]);
  });
});
