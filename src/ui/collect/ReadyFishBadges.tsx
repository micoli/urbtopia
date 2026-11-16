import { useStoreWithEqualityFn } from 'zustand/traditional';
import { footprintOf, readyFish, type GameState } from '../../core';
import { gameStore } from '../../store/gameStore';
import { CollectBadge, readyFishModels } from './CollectBadge';

interface FishBadgeSpec {
  id: number;
  worldX: number;
  worldZ: number;
  fish: number;
}

function sameFishBadges(a: readonly FishBadgeSpec[], b: readonly FishBadgeSpec[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((badge, index) => {
    const other = b[index]!;
    return badge.id === other.id && badge.worldX === other.worldX && badge.worldZ === other.worldZ && badge.fish === other.fish;
  });
}

function fishBadgesOf(state: GameState): FishBadgeSpec[] {
  const specs: FishBadgeSpec[] = [];
  for (const marina of state.buildings) {
    if (marina.type !== 'marina') continue;
    const fish = readyFish(state, marina.id);
    if (fish === 0) continue;
    const { width, depth } = footprintOf(marina.type, marina.rotation, marina.tier);
    specs.push({ id: marina.id, worldX: marina.x + width / 2, worldZ: marina.y + depth / 2, fish });
  }
  return specs;
}

export function ReadyFishBadges() {
  const badges = useStoreWithEqualityFn(gameStore, (store) => fishBadgesOf(store.state), sameFishBadges);
  return (
    <>
      {badges.map((badge) => (
        <CollectBadge
          key={badge.id}
          worldX={badge.worldX}
          worldZ={badge.worldZ}
          label={`✓ ${badge.fish}`}
          models={readyFishModels(badge.fish)}
          command={{ type: 'CollectCatch', marinaId: badge.id }}
        />
      ))}
    </>
  );
}
