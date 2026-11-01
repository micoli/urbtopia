import { tileKey } from '../map/geometry';
import type { Boat, GameState } from '../engine/state';
import { boatsOf, hostOf } from './boats';
import { bridgeKeys } from './bridges';
import { connectedWaterKeys } from './marina';

// A Boat on a vacated tile drifts to the nearest free tile of the water of its Marina or Pirate cove, and stays attached to it.
export function withBoatsMovedOff(state: GameState, vacated: ReadonlySet<string>): GameState | null {
  let current = state;
  for (const boat of boatsOf(state).filter((candidate) => vacated.has(tileKey(candidate)))) {
    const host = hostOf(current, boat.family, boat.marinaId);
    if (!host) return null;
    const taken = new Set([...boatsOf(current).map(tileKey), ...bridgeKeys(current), ...vacated]);
    const free = [...connectedWaterKeys(current, host)].filter((key) => !taken.has(key)).map((key) => key.split(',').map(Number) as [number, number]);
    const nearest = free.sort(([ax, ay], [bx, by]) => (ax - boat.x) ** 2 + (ay - boat.y) ** 2 - ((bx - boat.x) ** 2 + (by - boat.y) ** 2) || ax - bx || ay - by)[0];
    if (!nearest) return null;
    const moved: Boat = { ...boat, x: nearest[0], y: nearest[1] };
    current = { ...current, boats: boatsOf(current).map((candidate) => (candidate === boat ? moved : candidate)) };
  }
  return current;
}
