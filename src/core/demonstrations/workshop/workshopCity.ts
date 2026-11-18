import { createBuilding } from '../../buildings/buildingSpecs';
import { newGame } from '../../engine/newGame';
import { unpoweredBuildingIds } from '../../environment/powered';
import type { Command } from '../../engine/commands';
import type { FixtureId, GameState, Rotation } from '../../engine/state';
import { assignedFixturesOf, carriedItemOf, interiorLinksOf, lineFaultOf, type GoodId, type LineFault } from '../../index';
import { frontHasAccess } from '../../map/placement';
import type { DemonstrationStep } from '../scenario';

export const WORKSHOP_ID = 1;
const STOREHOUSE_ID = 2;

// The homes give the Citizens that open the interior, and the Storehouse takes what the restocker brings.
export function workshopCity(seed: string, tier: number): GameState {
  const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
  return {
    ...newGame({ now: 1_700_000_000_000, seed, tutorial: false, venueTutorials: false }),
    urbs: 50_000,
    buildings: [...homes, { ...createBuilding(WORKSHOP_ID, 'workshop', 60, 56, 2), tier }, createBuilding(STOREHOUSE_ID, 'storehouse', 70, 50, 0)],
    nextId: 100,
  };
}

export const demoWorkshop = (state: GameState) => {
  const workshop = state.buildings.find(building => building.id === WORKSHOP_ID);
  if (!workshop) throw new Error('demonstration Workshop missing');
  return workshop;
};

// Wood is a Material, which the interior focus accepts in the place of a Good.
export const WOOD = 'wood' as GoodId;
export const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation): Command => ({ type: 'PlaceInteriorFixture', buildingId: WORKSHOP_ID, fixture, x, y, rotation });
export const pick = (fixtureId: number, good: GoodId): Command => ({ type: 'SetInteriorFocus', buildingId: WORKSHOP_ID, fixtureId, good });

export interface WorkshopExpectation {
  count: number;
  // The Machines that receive their Drive and their Flow.
  linked?: readonly number[];
  // The Fixtures that a Line reaches, from the Extractor to the bin.
  lined?: readonly number[];
  // The item that reaches the bin.
  carried?: GoodId;
  // The bin that a restocker is assigned to.
  restocked?: number;
  // The first fault found from the bin back along its Line, when the step teaches one.
  fault?: LineFault['kind'];
}

const sorted = (ids: Iterable<number>) => [...ids].sort((a, b) => a - b).join(',');

export const checkWorkshop = ({ count, linked = [], lined = [], carried, restocked, fault }: WorkshopExpectation, bin?: number): DemonstrationStep['check'] => state => {
  const workshop = demoWorkshop(state);
  if (!frontHasAccess(state, workshop.type, workshop.x, workshop.y, workshop.rotation, workshop.tier)) throw new Error('demonstration Workshop needs Road access');
  if (unpoweredBuildingIds(state).has(workshop.id)) throw new Error('demonstration Workshop needs electricity');
  const fixtures = workshop.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} Fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  if (sorted(links.linked) !== sorted(linked)) throw new Error(`expected linked Machines ${sorted(linked)}, got ${sorted(links.linked)}`);
  if (sorted(links.lined) !== sorted(lined)) throw new Error(`expected lined Fixtures ${sorted(lined)}, got ${sorted(links.lined)}`);
  const exit = fixtures.find(fixture => fixture.id === bin);
  const carriedItem = exit ? carriedItemOf(fixtures, exit) ?? undefined : undefined;
  if (carriedItem !== carried) throw new Error(`expected carried item ${carried}, got ${carriedItem}`);
  const assigned = assignedFixturesOf(workshop.interior, 'restocker').map(fixture => fixture.id);
  if (assigned.join(',') !== (restocked === undefined ? '' : String(restocked))) throw new Error(`expected restocked bin ${restocked}, got ${assigned.join(',')}`);
  if (fault === undefined || !exit) return;
  const found = lineFaultOf(fixtures, exit)?.kind;
  if (found !== fault) throw new Error(`expected Line fault ${fault}, got ${found}`);
};
