import { useGame } from './hooks';
import { CollectBadge } from './CollectBadge';

export function CollectBadges() {
  const buildings = useGame((store) => store.state.buildings);
  return (
    <>
      {buildings.map((building) => {
        const readyCount = building.queue.filter((entry) => entry.done).length;
        return readyCount > 0 ? <CollectBadge key={building.id} building={building} readyCount={readyCount} /> : null;
      })}
    </>
  );
}
