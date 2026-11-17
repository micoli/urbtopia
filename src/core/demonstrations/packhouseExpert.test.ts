import { describe, expect, it } from 'vitest';
import { compileDemonstration } from './scenario';
import { packhouseExpert } from './packhouseExpert';

// The layout of a Tier 5 Packhouse interior that a player built: what the demonstration must end on.
const SCHEMA: readonly (readonly [string, number, number, number])[] = [
  ['packhousePacker', 0, 0, 0], ['packhousePackerLeft', 2, 0, 0], ['packhouseScanner', 0, 2, 0], ['packhouseScanner', 2, 2, 0],
  ['packhouseConveyor', 0, 1, 0], ['packhouseConveyor', 2, 1, 0], ['packhouseConveyorElbowLeft', 0, 3, 0], ['packhouseConveyor', 1, 3, 3],
  ['packhouseConveyorJoinStraightRight', 2, 3, 3], ['packhouseConveyor', 3, 3, 3], ['packhouseConveyor', 4, 3, 3], ['packhouseMotor', 1, 1, 2],
  ['packhouseBevelTee', 1, 0, 0],
  ['packhouseConveyorSplitStraightRight', 5, 3, 3], ['packhouseConveyorSplitStraightLeft', 6, 3, 3], ['packhouseConveyorSplitStraightRight', 7, 3, 3], ['packhouseConveyor', 5, 2, 2],
  ['packhouseConveyor', 7, 2, 2], ['packhouseConveyor', 6, 4, 0], ['packhouseStrapperLeft', 5, 1, 2], ['packhouseStrapper', 7, 1, 2],
  ['packhouseStrapper', 6, 5, 0], ['packhouseStrapperLeft', 8, 3, 3], ['packhouseExitBox', 5, 0, 0], ['packhouseExitPallet', 7, 0, 0],
  ['packhouseExitCrate', 9, 3, 1],
  ['packhouseMotor', 6, 2, 2], ['packhouseBevelTee', 6, 1, 0], ['packhouseMotor', 9, 5, 1], ['packhouseBevelTee', 8, 5, 2],
  ['packhouseShaft', 7, 5, 1], ['packhouseShaft', 8, 4, 0],
  ['packhouseConveyorSplitStraightRight', 6, 6, 0], ['packhouseConveyorElbowLeft', 6, 7, 0], ['packhouseConveyor', 7, 7, 3], ['packhouseConveyor', 8, 7, 3],
  ['packhouseConveyor', 7, 6, 3], ['packhouseConveyor', 8, 6, 3], ['packhouseExitPallet', 9, 6, 1], ['packhouseExitBox', 9, 7, 1],
];

const key = ([type, x, y, rotation]: readonly [string, number, number, number]) => `${type}@${x},${y}/${rotation}`;

describe('the expert Packhouse demonstration', () => {
  const final = compileDemonstration(packhouseExpert).at(-1)!.state;
  const packhouse = final.buildings.find(building => building.id === packhouseExpert.buildingId)!;

  it('ends on the layout of the schema, piece for piece', () => {
    const built = packhouse.interior!.fixtures.map(fixture => key([fixture.type, fixture.x, fixture.y, fixture.rotation])).sort();
    expect(built).toEqual(SCHEMA.map(key).sort());
  });

  it('ends with the staff of the schema, the goods picked and three Exits restocked', () => {
    expect(packhouse.tier).toBe(5);
    expect(packhouse.interior!.restockers).toBe(3);
    expect(packhouse.interior!.technicians).toBe(2);
    const exits = packhouse.interior!.fixtures.filter(fixture => fixture.type.startsWith('packhouseExit'));
    expect(exits.map(exit => [exit.x, exit.y, exit.restock, exit.restocker === true])).toEqual([[5, 0, 'grassBox', true], [7, 0, 'wheatPallet', true], [9, 3, 'carrotCrate', false], [9, 6, 'beetPallet', false], [9, 7, 'grassBox', true]]);
  });
});
