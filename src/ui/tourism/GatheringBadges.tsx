import { useStoreWithEqualityFn } from 'zustand/traditional';
import { footprintOf, gatheringPhase, gatheringPhaseEnd, type GameState } from '../../core';
import { gameStore } from '../../store/gameStore';
import { formatTimeLeft } from '../common/formatDuration';
import { GatheringBadge, type GatheringBadgeSpec } from './GatheringBadge';

function specsOf(state: GameState): GatheringBadgeSpec[] {
  return state.buildings.flatMap(building => {
    const gathering = building.attraction?.gathering;
    if (!gathering) return [];
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    const phase = gatheringPhase(gathering, state.lastSeen);
    return [{ id: building.id, worldX: building.x + width / 2, worldZ: building.y + depth / 2, kind: gathering.kind, phase, time: formatTimeLeft(gatheringPhaseEnd(gathering, phase) - state.lastSeen) }];
  });
}

const sameSpecs = (a: readonly GatheringBadgeSpec[], b: readonly GatheringBadgeSpec[]): boolean => a.length === b.length && a.every((spec, index) => JSON.stringify(spec) === JSON.stringify(b[index]));

export function GatheringBadges() {
  const specs = useStoreWithEqualityFn(gameStore, store => specsOf(store.state), sameSpecs);
  return <>{specs.map(spec => <GatheringBadge key={spec.id} {...spec} />)}</>;
}
