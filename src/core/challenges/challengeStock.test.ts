import { describe, expect, it } from 'vitest';
import { advance, challengeReward, dispatch, isChallengeStockComplete, newGame, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;
const GOAL = [
  { item: 'wood', quantity: 5 },
  { item: 'planks', quantity: 3 },
];

function stocked(overrides: Partial<GameState['storage']['materials']> = { wood: 20 }, goods: GameState['storage']['goods'] = { planks: 10 }): GameState {
  const state = newGame({ seed: 'amber-fox-4821', now: T0 });
  return { ...state, storage: { materials: overrides, goods } };
}

function run(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

function failure(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

const start = (state: GameState) => run(state, { type: 'ChallengeStart', id: 'c1', goal: GOAL, deadline: T0 + 24 * HOUR });

describe('ChallengeStart', () => {
  it('records the goal with an empty stock', () => {
    expect(start(stocked()).challenge).toEqual({ id: 'c1', goal: GOAL, stock: {}, deadline: T0 + 24 * HOUR });
  });

  it('is idempotent for the same Challenge and refused for another', () => {
    const started = start(stocked());
    expect(start(started)).toEqual(started);
    expect(failure(started, { type: 'ChallengeStart', id: 'c2', goal: GOAL, deadline: T0 })).toBe('error.challengeBusy');
  });

  it('refuses an invalid goal or id', () => {
    expect(failure(stocked(), { type: 'ChallengeStart', id: 'c1', goal: [], deadline: T0 })).toBe('error.invalidChallenge');
    expect(failure(stocked(), { type: 'ChallengeStart', id: '', goal: GOAL, deadline: T0 })).toBe('error.invalidChallenge');
    expect(failure(stocked(), { type: 'ChallengeStart', id: 'c1', goal: [{ item: 'unobtainium', quantity: 1 }], deadline: T0 })).toBe('error.invalidChallenge');
  });
});

describe('ChallengeSetAside', () => {
  it('takes units out of the Storehouse for good', () => {
    const state = run(start(stocked()), { type: 'ChallengeSetAside', item: 'wood', quantity: 2 });
    expect(state.storage.materials.wood).toBe(18);
    expect(state.challenge?.stock).toEqual({ wood: 2 });
  });

  it('adds up partial contributions and detects a complete stock', () => {
    let state = start(stocked());
    state = run(state, { type: 'ChallengeSetAside', item: 'wood', quantity: 2 });
    state = run(state, { type: 'ChallengeSetAside', item: 'wood', quantity: 3 });
    expect(isChallengeStockComplete(state.challenge)).toBe(false);
    state = run(state, { type: 'ChallengeSetAside', item: 'planks', quantity: 3 });
    expect(isChallengeStockComplete(state.challenge)).toBe(true);
    expect(state.storage.goods.planks).toBe(7);
  });

  it('refuses a surplus, a line already full and an item outside the goal', () => {
    const state = run(start(stocked()), { type: 'ChallengeSetAside', item: 'wood', quantity: 5 });
    expect(failure(state, { type: 'ChallengeSetAside', item: 'wood', quantity: 1 })).toBe('error.notInChallenge');
    expect(failure(start(stocked()), { type: 'ChallengeSetAside', item: 'planks', quantity: 4 })).toBe('error.challengeSurplus');
    expect(failure(start(stocked()), { type: 'ChallengeSetAside', item: 'stone', quantity: 1 })).toBe('error.notInChallenge');
  });

  it('refuses without a Challenge, with a bad quantity or without enough in the Storehouse', () => {
    expect(failure(stocked(), { type: 'ChallengeSetAside', item: 'wood', quantity: 1 })).toBe('error.noChallenge');
    expect(failure(start(stocked()), { type: 'ChallengeSetAside', item: 'wood', quantity: 0 })).toBe('error.invalidQuantity');
    expect(failure(start(stocked({ wood: 1 })), { type: 'ChallengeSetAside', item: 'wood', quantity: 2 })).toBe('error.missingMaterials');
    expect(failure(start(stocked({ wood: 20 }, {})), { type: 'ChallengeSetAside', item: 'planks', quantity: 1 })).toBe('error.missingGoods');
  });
});

describe('ChallengeClear', () => {
  it('forgets the Challenge and its stock without refunding anything', () => {
    const state = run(run(start(stocked()), { type: 'ChallengeSetAside', item: 'wood', quantity: 4 }), { type: 'ChallengeClear' });
    expect(state.challenge).toBeUndefined();
    expect('challenge' in state).toBe(false);
    expect(state.storage.materials.wood).toBe(16);
  });

  it('does nothing without a Challenge', () => {
    const state = stocked();
    expect(run(state, { type: 'ChallengeClear' })).toBe(state);
  });
});

describe('replay', () => {
  it('keeps the Challenge stock through a Catch-up', () => {
    const state = run(run(start(stocked()), { type: 'ChallengeSetAside', item: 'wood', quantity: 4 }), { type: 'ChallengeSetAside', item: 'planks', quantity: 1 });
    const later = advance(state, T0 + 10 * HOUR);
    expect(later.state.challenge).toEqual(state.challenge);
  });
});

describe('ChallengeComplete', () => {
  const full = (): GameState => {
    let state = start(stocked({ wood: 20 }, { planks: 10 }));
    state = run(state, { type: 'ChallengeSetAside', item: 'wood', quantity: 5 });
    return run(state, { type: 'ChallengeSetAside', item: 'planks', quantity: 3 });
  };

  it('pays twice the value of the goal in Urbs and clears the Challenge', () => {
    const before = full();
    const state = run(before, { type: 'ChallengeComplete', id: 'c1', rewardKind: 'urbs' });
    expect(challengeReward(GOAL)).toBe(2 * (5 * 3 + 3 * 14));
    expect(state.urbs).toBe(before.urbs + challengeReward(GOAL));
    expect(state.challenge).toBeUndefined();
    expect(state.challengeClaims).toEqual([{ id: 'c1', at: T0, urbs: challengeReward(GOAL) }]);
  });

  it('pays nothing in Urbs for a Medal and still consumes the stock', () => {
    const before = full();
    const state = run(before, { type: 'ChallengeComplete', id: 'c1', rewardKind: 'medal' });
    expect(state.urbs).toBe(before.urbs);
    expect(state.challenge).toBeUndefined();
    expect(state.storage.materials.wood).toBe(15);
  });

  it('credits once whatever the number of calls', () => {
    const once = run(full(), { type: 'ChallengeComplete', id: 'c1', rewardKind: 'urbs' });
    const twice = run(once, { type: 'ChallengeComplete', id: 'c1', rewardKind: 'urbs' });
    expect(twice).toEqual(once);
  });

  it('refuses an incomplete stock or another Challenge', () => {
    const partial = run(start(stocked()), { type: 'ChallengeSetAside', item: 'wood', quantity: 5 });
    expect(failure(partial, { type: 'ChallengeComplete', id: 'c1', rewardKind: 'urbs' })).toBe('error.noChallenge');
    expect(failure(full(), { type: 'ChallengeComplete', id: 'other', rewardKind: 'urbs' })).toBe('error.noChallenge');
    expect(failure(stocked(), { type: 'ChallengeComplete', id: 'c1', rewardKind: 'urbs' })).toBe('error.noChallenge');
  });

  it('forgets claims older than the retention', () => {
    const old = { ...full(), challengeClaims: [{ id: 'old', at: T0 - 31 * 24 * HOUR, urbs: 1 }] };
    expect(run(old, { type: 'ChallengeComplete', id: 'c1', rewardKind: 'urbs' }).challengeClaims?.map((claim) => claim.id)).toEqual(['c1']);
  });
});

describe('Time skip lock', () => {
  it('refuses a Time skip and a Tutorial step skip while a Challenge is accepted', () => {
    const state = start(stocked());
    expect(failure(state, { type: 'SkipTime', hours: 12 })).toBe('error.challengeInProgress');
    expect(failure(state, { type: 'SkipTutorialStep' })).toBe('error.challengeInProgress');
  });

  it('allows a Time skip again once the Challenge is cleared, and keeps Catch-up', () => {
    const cleared = run(start(stocked()), { type: 'ChallengeClear' });
    expect(failure(cleared, { type: 'SkipTime', hours: 12 })).toBeNull();
    expect(advance(start(stocked()), T0 + 30 * HOUR).state.challenge).toBeDefined();
  });
});
