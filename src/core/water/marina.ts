import { tiersOf } from '../buildings/buildingDefinitions';
import { footprintTiles } from '../buildings/buildingSpecs';
import { DIRECTIONS, neighbour, tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { Building, GameState } from '../engine/state';
import { waterKeys } from './waterTiles';

export function marinaCapacity(marina: Pick<Building, 'tier'>): number {
  const tiers = tiersOf('marina');
  return (tiers[marina.tier - 1] ?? tiers[0]!).boats!;
}

export function shoreWaterKeys(state: GameState, marina: Pick<Building, 'type' | 'x' | 'y' | 'rotation' | 'tier'>): string[] {
  const water = waterKeys(state);
  const footprint = footprintTiles(marina);
  const inside = new Set(footprint.map(tileKey));
  const shore = footprint.flatMap((tile) => DIRECTIONS.map((direction) => neighbour(tile, direction)));
  return [...new Set(shore.map(tileKey))].filter((key) => !inside.has(key) && water.has(key));
}

export function touchesWater(state: GameState, marina: Pick<Building, 'type' | 'x' | 'y' | 'rotation' | 'tier'>): boolean {
  return shoreWaterKeys(state, marina).length > 0;
}

export function connectedWaterKeys(state: GameState, marina: Pick<Building, 'type' | 'x' | 'y' | 'rotation' | 'tier'>): Set<string> {
  const water = waterKeys(state);
  const reached = new Set(shoreWaterKeys(state, marina));
  const queue = [...reached];
  while (queue.length > 0) {
    const [x, y] = queue.pop()!.split(',').map(Number) as [number, number];
    for (const direction of DIRECTIONS) {
      const next: Coord = neighbour({ x, y }, direction);
      const key = tileKey(next);
      if (!water.has(key) || reached.has(key)) continue;
      reached.add(key);
      queue.push(key);
    }
  }
  return reached;
}
