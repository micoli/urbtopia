import { BUILDING_IDS, definitionOf, isHomeType, kindOf } from '../buildings/buildingDefinitions';
import { totalCitizens } from '../buildings/city';
import type { BuildingId } from '../buildings/buildingTypes.generated';
import type { Building, GameState } from '../engine/state';

const sum = (buildings: readonly Building[], count: (building: Building) => number) => buildings.reduce((total, building) => total + count(building), 0);
const fixturesOf = (building: Building) => building.interior?.fixtures.length ?? 0;

const POWER_PLANTS: readonly string[] = ['powerPlant', 'coalPlant', 'hydroPlant', 'geothermalPlant', 'largeGeothermalPlant'];

// A number that only grows for the player who uses a feature: the count of what the City holds of it.
const NAMED = {
  roads: (state) => state.roads.length,
  pedestrianWays: (state) => state.pedestrianWays?.length ?? 0,
  bridges: (state) => state.bridges?.length ?? 0,
  busLines: (state) => state.busLines?.length ?? 0,
  brtRoads: (state) => state.brtRoads?.length ?? 0,
  railLines: (state) => state.transitLines?.filter((line) => line.mode === 'rail').length ?? 0,
  metroLines: (state) => state.transitLines?.filter((line) => line.mode === 'metro').length ?? 0,
  interiorFixtures: (state) => sum(state.buildings, fixturesOf),
  homeFixtures: (state) => sum(state.buildings.filter((building) => isHomeType(building.type)), fixturesOf),
  engineRoomFixtures: (state) => sum(state.buildings.filter((building) => POWER_PLANTS.includes(building.type)), fixturesOf),
  attractions: (state) => state.buildings.filter((building) => Boolean(definitionOf(building.type).attraction)).length,
  objectivesCompleted: (state) => state.politics?.completed.length ?? 0,
  electionsHeld: (state) => (state.politics ? state.politics.term.number - 1 : 0),
  housePlans: (state) => state.housePlans?.length ?? 0,
  designedHomes: (state) => state.buildings.filter((building) => building.design !== undefined).length,
  citizens: totalCitizens,
} as const satisfies Record<string, (state: GameState) => number>;

export type NamedCounter = keyof typeof NAMED;

// `kind:shop` counts the buildings of a kind, `building:library` and `building:hydroPlant,geothermalPlant` those of the listed types, `category:education` the Public facilities of a service category.
export type CounterId = NamedCounter | `kind:${string}` | `building:${string}` | `category:${string}`;

export function isNamedCounter(id: string): id is NamedCounter {
  return Object.hasOwn(NAMED, id);
}

function typesOf(list: string): BuildingId[] {
  return list.split(',') as BuildingId[];
}

export function isKnownCounter(id: string): boolean {
  if (isNamedCounter(id)) return true;
  const [prefix, rest = ''] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  if (prefix === 'building') return typesOf(rest).every((type) => BUILDING_IDS.includes(type));
  return prefix === 'kind' || prefix === 'category' ? rest.length > 0 : false;
}

export function counterValue(state: GameState, id: CounterId): number {
  if (isNamedCounter(id)) return NAMED[id](state);
  const separator = id.indexOf(':');
  const prefix = id.slice(0, separator);
  const rest = id.slice(separator + 1);
  if (prefix === 'kind') return state.buildings.filter((building) => kindOf(building.type) === rest).length;
  if (prefix === 'category') return state.buildings.filter((building) => kindOf(building.type) === 'facility' && definitionOf(building.type).category === rest).length;
  const types = typesOf(rest);
  return state.buildings.filter((building) => types.includes(building.type)).length;
}
