import type { Building } from '../../core';
import { useGame, useUi } from '../common/hooks';

export function useSelectedBuilding(): Building | null {
  const selectedId = useUi((store) => store.selectedBuildingId);
  return useGame((store) => store.state.buildings.find((candidate) => candidate.id === selectedId) ?? null);
}
