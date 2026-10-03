import { describe, expect, it } from 'vitest';
import { dispatch, newGame, type Command, type GameState } from '../core';
import { describeProgress, isGoalReached, playTurn, type Player } from './autoplayer';

const T0 = 1_700_000_000_000;
const MAX_TURNS = 20_000;

function headlessPlayer(initial: GameState): Player {
  let state = initial;
  return {
    state: () => state,
    send: (command: Command) => {
      const result = dispatch(state, command, T0);
      if (!result.ok) return result.error.key;
      state = result.state;
      return null;
    },
  };
}

describe('autoplayer', () => {
  it('plays a new game up to the highest Home Tier', () => {
    const player = headlessPlayer(newGame({ seed: 'amber-fox-4821', now: T0 }));
    let turns = 0;
    let hours = 0;
    while (!isGoalReached(player.state()) && turns < MAX_TURNS) {
      hours += playTurn(player);
      turns++;
      if (turns % 500 === 0) console.log(`turn ${turns} · ${hours.toFixed(0)} h · ${describeProgress(player.state())}`);
    }
    console.log(`done in ${turns} turns · ${hours.toFixed(0)} game hours · ${describeProgress(player.state())}`);
    expect(isGoalReached(player.state())).toBe(true);
  }, 60_000);
});
