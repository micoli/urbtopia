import { createBuilding } from '../buildings/buildingSpecs';
import { assignedFixturesOf, interiorLinksOf, type GoodId } from '../index';
import type { Command } from '../engine/commands';
import type { FixtureId, Rotation } from '../engine/state';
import { BUILDING_ID, lineCity, roomOf } from './lineInterior';
import type { DemonstrationStep } from './scenario';

export const textileCity = (seed: string) => {
  const state = lineCity('textileMill', seed, 1);
  return { ...state, buildings: [...state.buildings, { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }], storage: { ...state.storage, materials: { ...state.storage.materials, wool: 10 } } };
};
export const placeTextile = (fixture: FixtureId, x: number, y: number, rotation: Rotation): Command => ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture, x, y, rotation });
export const textileRecipe: Command = { type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId: 1, good: 'textile' as GoodId };
export const textileHire: Command = { type: 'HireInteriorStaff', buildingId: BUILDING_ID, role: 'spinner' };
export const textileAssign: Command = { type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId: 1 };
export const checkTextile = (count: number, linked: boolean, lined = false, assigned = false): DemonstrationStep['check'] => state => {
  const interior = roomOf(state).interior;
  const fixtures = interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  if (links.linked.has(1) !== linked || links.lined.has(1) !== lined) throw new Error(`expected spinner linked=${linked}, lined=${lined}`);
  if ((assignedFixturesOf(interior, 'spinner').length === 1) !== assigned) throw new Error(`expected assigned spinner=${assigned}`);
};
