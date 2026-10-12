import type { ReactNode } from 'react';
import { type Building, type BuildingType } from '../src/core';
import { useGame } from '../src/ui/common/hooks';

interface BuildingOfTypeProps {
  type: BuildingType;
  children: (building: Building) => ReactNode;
}

export function BuildingOfType({ type, children }: BuildingOfTypeProps) {
  const building = useGame((store) => store.state.buildings.find((candidate) => candidate.type === type));
  if (!building) throw new Error(`The game fixture has no "${type}" building`);
  return <>{children(building)}</>;
}
