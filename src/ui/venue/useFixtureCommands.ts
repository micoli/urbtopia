import { useGame } from '../common/hooks';
import { canPlaceFixture, canStandOnInterior, hasServiceInterior, isHomeType, isInteriorBuilding, isVenue, needsRepair as fixtureNeedsRepair, type Building, type Rotation, type VenueFixture } from '../../core';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';

const TURNS = [1, 2, 3] as const;

// The next turn at which the Fixture can stand where it is; a long Fixture may not fit at the next quarter turn.
function nextRotationOf(building: Building | undefined, fixture: VenueFixture): Rotation {
  const next = ((fixture.rotation + 1) % 4) as Rotation;
  if (!building) return next;
  const fits = (rotation: Rotation): boolean => {
    const candidate = { type: fixture.type, x: fixture.x, y: fixture.y, rotation };
    if (isInteriorBuilding(building)) return canStandOnInterior(building, candidate, fixture.id);
    return isVenue(building) && canPlaceFixture(building, candidate, fixture.id);
  };
  const rotations = TURNS.map(turn => ((fixture.rotation + turn) % 4) as Rotation);
  return rotations.find(fits) ?? next;
}

export function useFixtureCommands(venueId: number, fixture: VenueFixture | undefined) {
  const onFloor = useGame(store => store.state.buildings.some(candidate => candidate.id === venueId && isInteriorBuilding(candidate)));
  const repairable = useGame(store => store.state.buildings.some(candidate => candidate.id === venueId && !isHomeType(candidate.type) && !hasServiceInterior(candidate)));
  const needsRepair = repairable && fixture !== undefined && fixtureNeedsRepair(fixture);
  const rotate = () => {
    if (!fixture) return;
    const building = gameStore.getState().state.buildings.find(candidate => candidate.id === venueId);
    gameStore.getState().send({ type: onFloor ? 'MoveInteriorFixture' : 'MoveFixture', buildingId: venueId, fixtureId: fixture.id, x: fixture.x, y: fixture.y, rotation: nextRotationOf(building, fixture) });
  };
  const repair = () => {
    if (!fixture) return;
    gameStore.getState().send({ type: onFloor ? 'RepairInteriorFixture' : 'RepairFixture', buildingId: venueId, fixtureId: fixture.id });
  };
  const sell = () => {
    if (!fixture) return;
    gameStore.getState().send({ type: onFloor ? 'RemoveInteriorFixture' : 'RemoveFixture', buildingId: venueId, fixtureId: fixture.id });
    venueStore.getState().selectPlaced(null);
  };
  return { rotate, repair, needsRepair, sell };
}
