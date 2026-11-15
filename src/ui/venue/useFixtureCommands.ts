import { useGame } from '../common/hooks';
import { isInteriorBuilding, type VenueFixture } from '../../core';
import { gameStore } from '../../store/gameStore';
import { venueStore } from '../../store/venueStore';

export function useFixtureCommands(venueId: number, fixture: VenueFixture | undefined) {
  const onFloor = useGame(store => store.state.buildings.some(candidate => candidate.id === venueId && isInteriorBuilding(candidate)));
  const rotate = () => {
    if (!fixture) return;
    gameStore.getState().send({ type: onFloor ? 'MoveInteriorFixture' : 'MoveFixture', buildingId: venueId, fixtureId: fixture.id, x: fixture.x, y: fixture.y, rotation: ((fixture.rotation + 1) % 4) as 0 | 1 | 2 | 3 });
  };
  const sell = () => {
    if (!fixture) return;
    gameStore.getState().send({ type: onFloor ? 'RemoveInteriorFixture' : 'RemoveFixture', buildingId: venueId, fixtureId: fixture.id });
    venueStore.getState().selectPlaced(null);
  };
  return { rotate, sell };
}
