import { avatarsOfBuilding, fixtureTiles, gridSizeOf, hasLineInterior, hasProductionInterior, hasServiceInterior, interiorBonusOfBuilding, interiorFixturesOf, interiorMotionOf, interiorOverloadedOf, interiorSizeOf, isBroken, isInteriorBuilding, isPackhouse, isVenue, linePathsOf, linkedExitsOf, parquetModelOf, type Building, type Coord, type InteriorAvatars, type LinePath, type VenueFixture, type VenueType } from '../core';

// The share of its light a room keeps when its breaker is off.
const BREAKER_OFF_LIGHT = 0.3;

type FixtureMotions = ReturnType<typeof interiorMotionOf>;

// The same empty values each time, so that the scene sees nothing change.
const NO_PATHS: readonly LinePath[] = [];
const NO_MOTION: FixtureMotions = new Map();
const NO_EXITS: readonly VenueFixture[] = [];
const NO_AVATARS: readonly InteriorAvatars[] = [];

// What the scene shows of a building, derived from its state alone: the game and the demonstrations feed the scene with the same plan.
export interface ScenePlan {
  size: number;
  lightLevel: number;
  floorModel: string | undefined;
  fixtures: readonly VenueFixture[];
  line: { paths: readonly LinePath[]; pace: number };
  motion: { motion: FixtureMotions; pace: number };
  avatars: readonly InteriorAvatars[];
  trucks: readonly VenueFixture[];
  broken: readonly Coord[];
  // A bar shows once a Fixture is worn: a Production interior reads it as what is left, a Venue as what is lost.
  wear: { fixtures: readonly VenueFixture[]; remaining: boolean };
}

const brokenTilesOf = (fixtures: readonly VenueFixture[], overloaded: ReadonlySet<number>): Coord[] => fixtures.filter(fixture => isBroken(fixture) || overloaded.has(fixture.id)).flatMap(fixtureTiles);

const NO_OVERLOAD: ReadonlySet<number> = new Set();

const lightLevelOf = (building: Building): number => (building.breakerOff ? BREAKER_OFF_LIGHT : 1);

const interiorPlanOf = (building: Building): ScenePlan => {
  const fixtures = interiorFixturesOf(building);
  const parquet = building.interior?.parquet;
  const running = !building.breakerOff;
  const pace = 1 + interiorBonusOfBuilding(building).speed;
  return {
    size: interiorSizeOf(building),
    lightLevel: lightLevelOf(building),
    floorModel: parquet === undefined ? undefined : parquetModelOf(parquet),
    fixtures,
    line: { paths: hasLineInterior(building) && running ? linePathsOf(fixtures) : NO_PATHS, pace },
    motion: { motion: hasProductionInterior(building) && running ? interiorMotionOf(fixtures) : NO_MOTION, pace },
    avatars: hasServiceInterior(building) ? avatarsOfBuilding(building) : NO_AVATARS,
    trucks: isPackhouse(building) || building.type === 'recyclingPlant' ? linkedExitsOf(fixtures) : NO_EXITS,
    broken: brokenTilesOf(fixtures, hasProductionInterior(building) ? interiorOverloadedOf(fixtures) : NO_OVERLOAD),
    wear: { fixtures, remaining: hasProductionInterior(building) },
  };
};

export const scenePlanOf = (building: Building): ScenePlan | undefined => {
  if (isInteriorBuilding(building)) return interiorPlanOf(building);
  if (!isVenue(building)) return undefined;
  return {
    size: gridSizeOf(building.type as VenueType, building.tier),
    lightLevel: lightLevelOf(building),
    floorModel: undefined,
    fixtures: building.venue.fixtures,
    line: { paths: NO_PATHS, pace: 1 },
    motion: { motion: NO_MOTION, pace: 1 },
    avatars: NO_AVATARS,
    trucks: NO_EXITS,
    broken: brokenTilesOf(building.venue.fixtures, NO_OVERLOAD),
    wear: { fixtures: building.venue.fixtures, remaining: false },
  };
};
