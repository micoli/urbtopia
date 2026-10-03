import { useGame } from './hooks';
import { CollectBadge } from './CollectBadge';
import { collectBadgeLabel } from './collectBadgeLabel';

export function CollectBadges() {
  const buildings = useGame((store) => store.state.buildings);
  return (
    <>
      {buildings.map((building) => {
        const label = collectBadgeLabel(building);
        return label ? <CollectBadge key={building.id} building={building} label={label} /> : null;
      })}
    </>
  );
}
