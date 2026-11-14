import type { BuildingType, FixtureId, Rotation } from '../engine/state';

export interface ExampleFixture {
  readonly type: FixtureId;
  readonly x: number;
  readonly y: number;
  readonly rotation: Rotation;
}

const at = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): ExampleFixture => ({ type, x, y, rotation });

// A Tank, a Pump and the Motor that drives it, on the right of the machine at (x, y) for rotation 1 and on its left for rotation 3.
const dairyFlow = (x: number, y: number, rotation: 1 | 3): ExampleFixture[] => (rotation === 1
  ? [at('dairyTank', x + 1, y, 1), at('dairyPump', x, y, 1), at('dairyMotor', x, y + 1, 2)]
  : [at('dairyTank', x - 1, y, 3), at('dairyPump', x, y, 3), at('dairyMotor', x, y - 1, 0)]);

// The same, for a machine of a Workshop.
const workshopFlow = (x: number, y: number, rotation: 1 | 3): ExampleFixture[] => (rotation === 1
  ? [at('workshopTank', x + 1, y, 1), at('workshopPump', x, y, 1), at('workshopMotor', x, y + 1, 2)]
  : [at('workshopTank', x - 1, y, 3), at('workshopPump', x, y, 3), at('workshopMotor', x, y - 1, 0)]);

// Working set-ups of the Production interiors: what produces, what stores, what uses.
// Rotation 0 faces the front of the room, then 1 faces left, 2 faces the back wall and 3 faces right.
export interface InteriorExample {
  // The Tier of the building from which the room is large enough, and the Fixtures unlocked, for the whole set-up.
  readonly tier: number;
  readonly fixtures: readonly ExampleFixture[];
}

export const INTERIOR_EXAMPLES: Partial<Record<BuildingType, InteriorExample>> = {
  factory: { tier: 2, fixtures: [
    at('factoryTank', 3, 2), at('factoryPump', 3, 3), at('factoryMotor', 4, 3, 1), at('factoryPipeTee', 3, 4, 2), at('factoryMixingVat', 2, 4, 3),
    at('factoryMotor', 2, 5, 1), at('factoryShaft', 1, 5, 1), at('factoryPress', 0, 5, 3),
  ] },
  mill: { tier: 3, fixtures: [
    at('millMotor', 2, 2), at('millShaft', 2, 3), at('millstone', 2, 4, 2), at('millMotor', 4, 6, 2), at('millPump', 4, 5, 1), at('millPipeCross', 3, 5), at('millPipeCross', 2, 5),
    at('millPipe', 1, 5, 1), at('millCleaner', 0, 5, 1), at('millBagger', 2, 6), at('millOilTank', 3, 4, 2),
  ] },
  workshop: { tier: 1, fixtures: [
    at('workshopExtractorRight', 0, 0), at('workshopConveyor', 0, 1), at('workshopCleanerRight', 0, 2), at('workshopConveyor', 0, 3), at('workshopBin', 0, 4),
    ...workshopFlow(1, 0, 1), ...workshopFlow(1, 2, 1),
  ] },
  bakery: { tier: 3, fixtures: [
    at('bakeryMixer', 4, 0), at('bakeryShaft', 5, 0, 1), at('bakeryMotor', 6, 0, 1), at('bakeryTank', 2, 2, 3), at('bakeryPump', 3, 2, 3), at('bakeryMotor', 3, 1),
    at('bakeryConveyor', 4, 1), at('bakeryOven', 4, 2), at('bakeryConveyor', 4, 3), at('bakeryConveyor', 4, 4), at('bakeryConveyor', 4, 5), at('bakeryConveyor', 4, 6), at('bakeryCounter', 4, 7, 2),
  ] },
  dairy: { tier: 3, fixtures: [
    at('dairyMilkVat', 4, 0), at('dairyConveyor', 4, 1), at('dairyPasteurizer', 4, 2), at('dairyConveyor', 4, 3), at('dairyCheeseCellar', 4, 4), at('dairyConveyor', 4, 5),
    at('dairyConveyor', 4, 6), at('dairyCounter', 4, 7, 2), ...dairyFlow(5, 0, 1), ...dairyFlow(3, 2, 3), ...dairyFlow(3, 4, 3),
  ] },
  packhouse: { tier: 2, fixtures: [
    at('packhousePacker', 4, 0), at('packhouseShaft', 5, 0, 1), at('packhouseMotor', 6, 0, 1), at('packhouseConveyor', 4, 1), at('packhouseConveyor', 4, 2), at('packhouseConveyor', 4, 3), at('packhouseConveyor', 4, 4), at('packhouseConveyor', 4, 5), at('packhouseExitCrate', 4, 6, 2),
  ] },
  storehouse: { tier: 5, fixtures: [
    at('storehouseDock', 4, 0), at('storehouseShaft', 5, 0, 1), at('storehouseMotor', 6, 0, 1), at('storehouseConveyor', 4, 1), at('storehouseHoist', 4, 2), at('storehouseShaft', 5, 2, 1),
    at('storehouseMotor', 6, 2, 1), at('storehouseConveyor', 4, 3), at('storehouseConveyor', 4, 4), at('storehouseConveyor', 4, 5), at('storehouseConveyor', 4, 6), at('storehouseRack', 4, 7, 2),
  ] },
};

export const interiorExampleOf = (type: BuildingType): InteriorExample | undefined => INTERIOR_EXAMPLES[type];
