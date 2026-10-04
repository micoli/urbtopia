import { footprintOf } from '../../core';
import { useGame } from '../common/hooks';
import { CollectBadge, collectBadgeLabel } from './CollectBadge';
import { ReadyFieldBadges } from './ReadyFieldBadges';

export function CollectBadges() {
  const buildings = useGame((store) => store.state.buildings);
  return (
    <>
      {buildings.map((building) => {
        const label = collectBadgeLabel(building);
        if (!label) return null;
        const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
        return (
          <CollectBadge
            key={building.id}
            worldX={building.x + width / 2}
            worldZ={building.y + depth / 2}
            label={label}
            command={{ type: 'Collect', buildingId: building.id }}
          />
        );
      })}
      <ReadyFieldBadges />
    </>
  );
}
