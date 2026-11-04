import { pedestrianAccessRotation, type Coord, type Rotation } from '../../core';
import { useGame, useUi } from '../common/hooks';

// The Pedestrian access picked on the map, with the turn of its open front, while it still stands.
export function useSelectedAccess(): { tile: Coord; rotation: Rotation } | null {
  const picked = useUi((store) => store.selectedAccess);
  const stands = useGame((store) => picked !== null && (store.state.pedestrianAccesses ?? []).some((access) => access.x === picked.x && access.y === picked.y));
  const rotation = useGame((store) => (picked ? pedestrianAccessRotation(store.state, picked) : 0));
  return picked && stands ? { tile: picked, rotation } : null;
}
