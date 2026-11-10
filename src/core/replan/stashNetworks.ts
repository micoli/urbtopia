import { NETWORK_KEY, extendNetwork, networkTiles } from '../transit/transitNetwork';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { GameState, NetworkMode } from '../engine/state';
import { stashOf, withStash, type StashOutcome } from './stash';

// The BRT corridor, the Railway and the Tunnels of the Metro are drawn by path, so the Stash only counts the tiles lifted from them.
export function liftNetwork(state: GameState, mode: NetworkMode, targets?: readonly Coord[]): StashOutcome {
  const key = NETWORK_KEY[mode];
  const keys = targets && new Set(targets.map(tileKey));
  const lifted = networkTiles(state, mode).filter((tile) => !keys || keys.has(tileKey(tile)));
  if (lifted.length === 0) return { key: 'error.unknownCommand' };
  const kept = networkTiles(state, mode).filter((tile) => !lifted.includes(tile));
  return { state: withStash({ ...state, [key]: kept }, { [key]: [...(stashOf(state)[key] ?? []), ...lifted] }) };
}

// Draws a stretch under the usual rules of a new one, free, and uses up as many Stash tiles as it adds; the exits are worked out again.
export function placeStashedNetwork(state: GameState, mode: NetworkMode, from: Coord, to: Coord, horizontalFirst = true): StashOutcome {
  if (!state.replan) return { key: 'error.unknownCommand' };
  const key = NETWORK_KEY[mode];
  const extended = extendNetwork(state, mode, from, to, horizontalFirst);
  if ('key' in extended) return { key: extended.key };
  const stashed = stashOf(state)[key] ?? [];
  const added = extended.tiles.length - networkTiles(state, mode).length;
  if (added > stashed.length) return { key: 'error.unknownCommand' };
  return { state: withStash({ ...state, [key]: extended.tiles }, { [key]: stashed.slice(added) }) };
}
