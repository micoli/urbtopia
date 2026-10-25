import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from 'zustand';
import { footprintOf, officeYieldMultiplierOf } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { CollectBadge, collectBadgeLabel, readyItemModels } from './CollectBadge';
import { ReadyFieldBadges } from './ReadyFieldBadges';

interface BadgeSpec {
  id: number;
  worldX: number;
  worldZ: number;
  label: string | number;
  models: string[];
}

function sameBadges(a: readonly BadgeSpec[], b: readonly BadgeSpec[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((badge, index) => {
    const other = b[index]!;
    return badge.id === other.id && badge.worldX === other.worldX && badge.worldZ === other.worldZ && badge.label === other.label && badge.models.join() === other.models.join();
  });
}

function badgeSpecsOf(buildings: readonly Parameters<typeof collectBadgeLabel>[0][], officeYield: number): BadgeSpec[] {
  const specs: BadgeSpec[] = [];
  for (const building of buildings) {
    const label = collectBadgeLabel(building, officeYield);
    if (!label) continue;
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    specs.push({ id: building.id, worldX: building.x + width / 2, worldZ: building.y + depth / 2, label, models: readyItemModels(building) });
  }
  return specs;
}

export function CollectBadges() {
  const officeYield = useGame((store) => officeYieldMultiplierOf(store.state));
  const showTaxBadges = useStore(prefsStore, (store) => store.showTaxBadges);
  const allBadges = useStoreWithEqualityFn(gameStore, (store) => badgeSpecsOf(store.state.buildings, officeYield), sameBadges);
  const badges = showTaxBadges ? allBadges : allBadges.filter((badge) => typeof badge.label !== 'number');
  return (
    <>
      {badges.map((badge) => (
        <CollectBadge
          key={badge.id}
          worldX={badge.worldX}
          worldZ={badge.worldZ}
          label={badge.label}
          models={badge.models}
          command={{ type: 'Collect', buildingId: badge.id }}
        />
      ))}
      <ReadyFieldBadges />
    </>
  );
}
