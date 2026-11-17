import type { BuildingType, FixtureId, Rotation } from '../engine/state';

export interface ExampleFixture {
  readonly type: FixtureId;
  readonly x: number;
  readonly y: number;
  readonly rotation: Rotation;
}

const at = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): ExampleFixture => ({ type, x, y, rotation });

// The smallest working set-ups of the Production interiors: only the Fixtures without which a Machine or a Line would stop.
// Rotation 0 faces the front of the room, then 1 faces left, 2 faces the back wall and 3 faces right.
export interface InteriorExample {
  // The Tier of the building from which the room is large enough, and the Fixtures unlocked, for the whole set-up.
  readonly tier: number;
  readonly fixtures: readonly ExampleFixture[];
}

const STOREHOUSE_EXAMPLE: InteriorExample = { tier: 1, fixtures: [at('storehouseDock', 0, 0), at('storehouseMotor', 1, 0, 1), at('storehouseRack', 0, 1, 2)] };

export const INTERIOR_EXAMPLES: Partial<Record<BuildingType, InteriorExample>> = {
  factory: { tier: 2, fixtures: [
    at('factoryTank', 1, 0), at('factoryPump', 1, 1), at('factoryMotor', 2, 1, 1), at('factoryPipeTee', 1, 2, 2), at('factoryMixingVat', 0, 2, 3),
  ] },
  mill: { tier: 1, fixtures: [
    at('millMotor', 0, 0), at('millstone', 0, 1, 2), at('millMotor', 2, 3, 2), at('millPump', 2, 2, 1), at('millPipeCross', 1, 2), at('millPipeCross', 0, 2),
    at('millCleaner', 1, 1), at('millBagger', 0, 3, 2),
  ] },
  workshop: { tier: 1, fixtures: [
    at('workshopExtractorRight', 0, 0), at('workshopBin', 0, 1), at('workshopPump', 1, 0, 1), at('workshopTank', 2, 0, 1), at('workshopMotor', 1, 1, 2),
  ] },
  bakery: { tier: 2, fixtures: [
    at('bakeryMixer', 5, 0), at('bakeryMotor', 6, 0, 1), at('bakeryOven', 5, 1), at('bakeryPump', 4, 1, 3), at('bakeryTank', 3, 1, 3), at('bakeryMotor', 4, 0), at('bakeryCounter', 5, 2, 2),
  ] },
  dairy: { tier: 3, fixtures: [
    at('dairyMilkVat', 4, 0), at('dairyPump', 5, 0, 1), at('dairyTank', 6, 0, 1), at('dairyMotor', 5, 1, 2), at('dairyConveyor', 4, 1), at('dairyPasteurizer', 4, 2),
    at('dairyPump', 3, 2, 3), at('dairyTank', 2, 2, 3), at('dairyMotor', 3, 1), at('dairyCounter', 4, 3, 2),
  ] },
  packhouse: { tier: 1, fixtures: [
    at('packhousePacker', 1, 0), at('packhouseMotor', 2, 0, 1), at('packhouseConveyorElbowRight', 1, 1), at('packhouseExitCrate', 0, 1, 3),
  ] },
  recyclingPlant: { tier: 1, fixtures: [
    at('recyclingPlantIntake', 0, 0), at('recyclingPlantMotor', 1, 0, 1), at('recyclingPlantSorter', 0, 1), at('recyclingPlantMotor', 1, 1, 1),
    at('recyclingPlantShredder', 0, 2), at('recyclingPlantMotor', 1, 2, 1), at('recyclingPlantConveyor', 0, 3), at('recyclingPlantExit', 0, 4, 2),
  ] },
  textileMill: { tier: 1, fixtures: [at('textileMotor', 0, 0), at('textileSpinner', 0, 1, 2)] },
  knitwearFactory: { tier: 1, fixtures: [
    at('knitwearKnitter', 0, 0), at('knitwearMotor', 1, 0, 1), at('knitwearFinisher', 0, 1), at('knitwearMotor', 1, 1, 1), at('knitwearCounter', 0, 2, 2),
  ] },
  livestockFarm: { tier: 1, fixtures: [
    at('livestockFeedIntake', 0, 0), at('livestockMotor', 1, 0, 1), at('livestockFeeder', 0, 1, 2), at('livestockPen', 0, 2), at('livestockPacker', 0, 3),
    at('livestockMotor', 1, 3, 1), at('livestockCollectionExit', 0, 4, 2),
  ] },
  storehouse: STOREHOUSE_EXAMPLE,
  vault: STOREHOUSE_EXAMPLE,
  materialDepot: STOREHOUSE_EXAMPLE,
};

export const interiorExampleOf = (type: BuildingType): InteriorExample | undefined => INTERIOR_EXAMPLES[type];
