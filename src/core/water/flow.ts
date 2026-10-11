import type { Building, GameState } from '../engine/state';
import { ECOLOGY } from '../environment/ecology';
import { connectedWaterKeys } from './marina';

export function flowFactor(state: GameState, plant: Pick<Building, 'type' | 'x' | 'y' | 'rotation' | 'tier'>): number {
  return Math.min(1, connectedWaterKeys(state, plant).size / ECOLOGY.hydroFullFlowTiles);
}
