import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

function play(state: GameState, command: Command, now: number): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`${command.type} failed at +${(now - T0) / MINUTE} min: ${result.error.key}`);
  return result.state;
}

describe('first session pacing with the starting numbers', () => {
  it('reaches the first sale on the Market within 5 minutes without any other income', () => {
    let state = newGame({ seed: 'amber-fox-4821', now: T0 });
    state = play(state, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 }, T0);
    state = play(state, { type: 'QueueProduction', buildingId: 1, item: 'wood' }, T0);
    state = play(state, { type: 'QueueProduction', buildingId: 1, item: 'wood' }, T0);

    const twoMinutes = T0 + 2 * MINUTE;
    state = play(state, { type: 'Collect', buildingId: 1 }, twoMinutes);
    state = play(state, { type: 'QueueProduction', buildingId: 2, item: 'planks' }, twoMinutes);

    const fourMinutes = T0 + 4 * MINUTE;
    state = play(state, { type: 'Collect', buildingId: 2 }, fourMinutes);
    const before = state.urbs;
    state = play(state, { type: 'SellToMarket', good: 'planks', quantity: 1 }, fourMinutes);

    expect(state.urbs).toBeGreaterThan(before);
    expect(advance(state, fourMinutes).state.lastSeen - T0).toBeLessThanOrEqual(5 * MINUTE);
  });
});
