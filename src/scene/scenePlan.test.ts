import { describe, expect, it } from 'vitest';
import { createBuilding, type Building, type FixtureId, type Rotation, type VenueFixture } from '../core';
import { scenePlanOf } from './scenePlan';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id: nextId++, type, x, y, rotation });

const interiorOf = (type: Building['type'], fixtures: VenueFixture[], extra: Partial<Building> = {}): Building => ({
  ...createBuilding(1, type, 0, 0, 0),
  tier: 1,
  interior: { nextFixtureId: 100, fixtures },
  ...extra,
});

describe('the Scene plan of a building', () => {
  it('gives the size of the room by Tier and the Fixtures of an interior', () => {
    const fixtures = [put('packhousePacker', 2, 0)];
    const plan = scenePlanOf(interiorOf('packhouse', fixtures));
    expect(plan?.size).toBe(6);
    expect(plan?.fixtures).toEqual(fixtures);
  });

  it('gives nothing to a building with neither an interior nor a Venue', () => {
    expect(scenePlanOf(createBuilding(1, 'farm', 0, 0, 0))).toBeUndefined();
  });

  it('keeps a room whose breaker is off dim, and a running one at full light', () => {
    expect(scenePlanOf(interiorOf('packhouse', [], { breakerOff: true }))?.lightLevel).toBe(0.3);
    expect(scenePlanOf(interiorOf('packhouse', []))?.lightLevel).toBe(1);
  });

  it('gives the floor the player chose, and none when the floor is the one of its kind', () => {
    expect(scenePlanOf(interiorOf('packhouse', []))?.floorModel).toBeUndefined();
    const parquet = scenePlanOf(interiorOf('packhouse', [], { interior: { nextFixtureId: 1, fixtures: [], parquet: 1 } }))?.floorModel;
    expect(parquet).toBeDefined();
    expect(parquet).not.toBe(scenePlanOf(interiorOf('packhouse', [], { interior: { nextFixtureId: 1, fixtures: [], parquet: 2 } }))?.floorModel);
  });

  const runningLine = (): VenueFixture[] => [put('packhousePacker', 2, 0), put('packhouseShaft', 3, 0, 1), put('packhouseMotor', 4, 0, 1), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2), put('packhouseExitCrate', 2, 3, 2)];

  it('shows the Packets of a Line and the Fixtures that turn, at the pace of the bonus', () => {
    const plan = scenePlanOf(interiorOf('packhouse', runningLine()));
    expect(plan?.line.paths).toHaveLength(1);
    expect(plan?.motion.motion.size).toBeGreaterThan(0);
    expect(plan?.line.pace).toBeGreaterThan(1);
    expect(plan?.motion.pace).toBe(plan?.line.pace);
  });

  it('stops the Line and the motion of a room whose breaker is off', () => {
    const plan = scenePlanOf(interiorOf('packhouse', runningLine(), { breakerOff: true }));
    expect(plan?.line.paths).toHaveLength(0);
    expect(plan?.motion.motion.size).toBe(0);
    expect(plan?.line.pace).toBe(1);
  });

  it('shows no Line and no motion in a Home', () => {
    const plan = scenePlanOf(interiorOf('home', []));
    expect(plan?.line.paths).toHaveLength(0);
    expect(plan?.motion.motion.size).toBe(0);
  });

  it('stands the hired Staff of a Service interior in the room, and none elsewhere', () => {
    const hospital = scenePlanOf(interiorOf('hospital', [], { interior: { nextFixtureId: 1, fixtures: [], staff: { nurse: 1 } } }));
    expect(hospital?.avatars).toHaveLength(1);
    expect(hospital?.avatars[0]?.count).toBe(1);
    expect(scenePlanOf(interiorOf('packhouse', runningLine()))?.avatars).toHaveLength(0);
  });

  it('waits a truck outside each linked Exit of a Packhouse', () => {
    const plan = scenePlanOf(interiorOf('packhouse', runningLine()));
    expect(plan?.trucks.map(exit => exit.type)).toEqual(['packhouseExitCrate']);
  });

  it('waits a truck outside each linked Exit of a Recycling plant', () => {
    const machines: FixtureId[] = ['recyclingPlantIntake', 'recyclingPlantSorter', 'recyclingPlantShredder'];
    const fixtures = [...machines.flatMap((type, y) => [put(type, 1, y), put('recyclingPlantShaft', 2, y, 1), put('recyclingPlantMotor', 3, y, 1)]), ...Array.from({ length: 4 }, (_, k) => put('recyclingPlantConveyor', 1, 3 + k)), put('recyclingPlantExit', 1, 7, 2)];
    const plan = scenePlanOf(interiorOf('recyclingPlant', fixtures, { tier: 4 }));
    expect(plan?.trucks.map(exit => exit.type)).toEqual(['recyclingPlantExit']);
  });

  it('waits no truck at the Exits of the other interiors', () => {
    expect(scenePlanOf(interiorOf('factory', []))?.trucks).toHaveLength(0);
  });

  it('marks the broken Fixtures of an interior, and reads the wear of its Machines as what is left', () => {
    const conveyor: VenueFixture = { ...put('packhouseConveyor', 2, 1), broken: true };
    const plan = scenePlanOf(interiorOf('packhouse', [conveyor]));
    expect(plan?.broken).toEqual([{ x: 2, y: 1 }]);
    expect(plan?.wear).toEqual({ fixtures: [conveyor], remaining: true });
  });

  it('reads the wear of a Venue as what is lost, and marks its broken Fixtures', () => {
    const arcade = { ...createBuilding(1, 'arcade', 0, 0, 0), tier: 1 };
    const machine: VenueFixture = { ...put('airHockey', 1, 1), broken: true };
    const plan = scenePlanOf({ ...arcade, venue: { ...arcade.venue!, fixtures: [machine] } });
    expect(plan?.wear.remaining).toBe(false);
    expect(plan?.broken).toHaveLength(1);
  });

  it('shares the references of the Line, the motion and the trucks between two plans of the same building, so the scene does not rebuild them', () => {
    const building = interiorOf('packhouse', runningLine());
    const first = scenePlanOf(building)!;
    const second = scenePlanOf(building)!;
    expect(second.line.paths).toBe(first.line.paths);
    expect(second.motion.motion).toBe(first.motion.motion);
    expect(second.trucks).toBe(first.trucks);
  });

  it('shares the same empty values between rooms that show none', () => {
    const first = scenePlanOf(interiorOf('home', []))!;
    const second = scenePlanOf(interiorOf('home', [], { id: 2 }))!;
    expect(second.line.paths).toBe(first.line.paths);
    expect(second.motion.motion).toBe(first.motion.motion);
    expect(second.trucks).toBe(first.trucks);
  });
});
