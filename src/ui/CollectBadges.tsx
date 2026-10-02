import { useGame } from './hooks';
import { CollectBadge } from './CollectBadge';
import type { Building } from '../core';

function badgeLabel(building: Building): string | null {
  if (building.type === 'shop') {
    const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
    return earned > 0 ? `+${earned}` : null;
  }
  const ready = building.queue.filter((entry) => entry.done).length;
  return ready > 0 ? `✓ ${ready}` : null;
}

export function CollectBadges() {
  const buildings = useGame((store) => store.state.buildings);
  return (
    <>
      {buildings.map((building) => {
        const label = badgeLabel(building);
        return label ? <CollectBadge key={building.id} building={building} label={label} /> : null;
      })}
    </>
  );
}
