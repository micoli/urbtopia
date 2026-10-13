import { beforeEach, describe, expect, it, vi } from 'vitest';
import { challengeReward, dispatch, newGame, type Command, type GameState } from '../core';
import { challengeStore } from '../store/challengeStore';
import { createChallengeActions, type ChallengeGame } from './challengeActions';
import { FakeChallengeWorld } from './fakeChallengeClient';
import { loadChallengeClient } from './loadChallengeClient';
import { parseChallengeSnapshot, parseDeclaration } from './parseSnapshot';
import { toChallengeError } from './supabaseChallengeClient';
import { ChallengeError, type Challenge } from './types';
import { visibleChallenges } from './visibleChallenges';

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;
const initial = newGame({ seed: 'amber-fox-4821', now: T0 });

function withCitizens(citizens: number): GameState {
  const homes = Array.from({ length: citizens / 6 }, (_, index) => ({ id: 100 + index, type: 'home' as const, x: 40 + index, y: 40, rotation: 0 as const, slotCount: 0, queue: [], stacks: [], tier: 1, taxCitizenMs: 0 }));
  return { ...initial, buildings: [...initial.buildings, ...homes] };
}

function daily(id: string, difficulty: 'easy' | 'medium' | 'hard', minCitizens: number, item = 'wood'): Challenge {
  return { id, kind: 'daily', difficulty, minCitizens, goal: [{ item, quantity: 5 }], rewardKind: 'urbs', medalCode: null, nameKeys: { hook: 0, item }, nameFr: null, nameEn: null, startsAt: T0 - 1000, endsAt: T0 + DAY };
}

function event(id: string, minCitizens = 0): Challenge {
  return { ...daily(id, 'easy', minCitizens), kind: 'event', difficulty: null, rewardKind: 'medal', medalCode: 'port-festival' };
}

describe('loadChallengeClient', () => {
  it('returns null without configuration, so supabase-js is never imported', async () => {
    expect(await loadChallengeClient({})).toBeNull();
  });
});

describe('toChallengeError', () => {
  it.each([
    ['urb_email_required', 'email-required'],
    ['urb_handle_required', 'handle-required'],
    ['urb_challenge_unavailable', 'challenge-unavailable'],
    ['urb_challenge_busy', 'challenge-busy'],
  ])('maps %s to %s', (message, kind) => {
    expect(toChallengeError({ message }).kind).toBe(kind);
  });

  it('maps a network failure to offline and anything else to unknown', () => {
    expect(toChallengeError({ message: 'Failed to fetch', code: '' }).kind).toBe('offline');
    expect(toChallengeError({ message: 'boom', code: 'XX000' }).kind).toBe('unknown');
  });
});

describe('parseChallengeSnapshot', () => {
  const json = {
    now: '2026-10-13T10:00:00Z',
    challenges: [
      { id: 'a', kind: 'daily', difficulty: 'easy', minCitizens: 0, goal: [{ item: 'wood', quantity: 5 }], rewardKind: 'urbs', medalCode: null, nameKeys: { hook: 3, item: 'wood' }, nameFr: null, nameEn: null, startsAt: '2026-10-13T00:00:00Z', endsAt: '2026-10-14T00:00:00Z' },
      { id: 'b', kind: 'daily', difficulty: 'easy', minCitizens: 0, goal: [{ item: 'unobtainium', quantity: 5 }], rewardKind: 'urbs', medalCode: null, nameKeys: { hook: 3, item: 'unobtainium' }, nameFr: null, nameEn: null, startsAt: '2026-10-13T00:00:00Z', endsAt: '2026-10-14T00:00:00Z' },
    ],
    accepted: null,
    medals: [{ challengeId: 'c', medalCode: 'x', earnedAt: '2026-10-12T10:00:00Z' }],
  };

  it('reads Challenges, the accepted one and the Medals', () => {
    const snapshot = parseChallengeSnapshot(json);
    expect(snapshot.challenges.map(({ id }) => id)).toEqual(['a']);
    expect(snapshot.accepted).toBeNull();
    expect(snapshot.medals).toHaveLength(1);
    expect(snapshot.serverNow).toBe(Date.parse('2026-10-13T10:00:00Z'));
  });

  it('leaves out a Challenge asking for an item the game does not know', () => {
    expect(parseChallengeSnapshot(json).challenges.some(({ id }) => id === 'b')).toBe(false);
  });

  it('rejects a malformed answer', () => {
    expect(() => parseChallengeSnapshot({ ...json, challenges: 'nope' })).toThrow(ChallengeError);
    expect(() => parseDeclaration({ challengeId: 'a' })).toThrow(ChallengeError);
  });
});

describe('visibleChallenges', () => {
  const all = [daily('e0', 'easy', 0), daily('e100', 'easy', 100, 'fish'), daily('m0', 'medium', 0), daily('h0', 'hard', 0), daily('h600', 'hard', 600, 'coal'), event('ev'), event('ev-late', 5000)];

  it('keeps the highest reachable band of each difficulty, then the Events', () => {
    expect(visibleChallenges(initial, all).map(({ id }) => id)).toEqual(['e0', 'm0', 'h0', 'ev']);
    expect(visibleChallenges(withCitizens(120), all).map(({ id }) => id)).toEqual(['e100', 'm0', 'h0', 'ev']);
  });

  it('hides a band whose items are not unlocked even when the threshold is met', () => {
    const locked = [daily('e0', 'easy', 0), { ...daily('e10', 'easy', 10), goal: [{ item: 'coal', quantity: 5 }] }];
    expect(visibleChallenges(withCitizens(12), locked).map(({ id }) => id)).toEqual(['e0']);
  });
});

describe('FakeChallengeWorld', () => {
  it('lists the Challenges open now', async () => {
    const world = new FakeChallengeWorld(() => T0);
    world.challenges = [daily('a', 'easy', 0), { ...daily('old', 'easy', 0), endsAt: T0 - 1 }];
    expect((await world.client('p1').list()).challenges.map(({ id }) => id)).toEqual(['a']);
  });

  it('refuses a second Challenge while one is accepted, and an unknown one', async () => {
    const world = new FakeChallengeWorld(() => T0);
    world.challenges = [daily('a', 'easy', 0), event('ev')];
    const client = world.client('p1');
    await client.accept('a');
    await expect(client.accept('ev')).rejects.toMatchObject({ kind: 'challenge-busy' });
    await expect(client.accept('zzz')).rejects.toMatchObject({ kind: 'challenge-unavailable' });
  });

  it('requires an account with an email and a Handle', async () => {
    const world = new FakeChallengeWorld(() => T0);
    await expect(world.client(null).list()).rejects.toMatchObject({ kind: 'unauthenticated' });
    await expect(world.client('p1', { email: false }).list()).rejects.toMatchObject({ kind: 'email-required' });
    await expect(world.client('p1', { handle: false }).list()).rejects.toMatchObject({ kind: 'handle-required' });
  });

  it('expires an acceptance past its deadline and frees the player', async () => {
    let now = T0;
    const world = new FakeChallengeWorld(() => now);
    world.challenges = [{ ...daily('a', 'easy', 0), endsAt: T0 + 3 * DAY }, daily('b', 'easy', 0)];
    const client = world.client('p1');
    await client.accept('a');
    now = T0 + DAY + 1;
    expect((await client.list()).accepted).toBeNull();
    await expect(client.declare('a')).rejects.toMatchObject({ kind: 'challenge-unavailable' });
  });

  it('answers a repeated declaration as already claimed, and records the Medal once', async () => {
    const world = new FakeChallengeWorld(() => T0);
    world.challenges = [event('ev')];
    const client = world.client('p1');
    await client.accept('ev');
    expect((await client.declare('ev')).alreadyClaimed).toBe(false);
    expect((await client.declare('ev')).alreadyClaimed).toBe(true);
    expect((await client.list()).medals).toHaveLength(1);
  });
});

describe('challenge actions', () => {
  beforeEach(() => challengeStore.setState({ status: 'idle', snapshot: null, busy: false, failure: null }));

  const GOAL = [{ item: 'wood', quantity: 4 }, { item: 'planks', quantity: 2 }];
  const goalChallenge = (): Challenge => ({ ...daily('a', 'easy', 0), goal: GOAL });

  function setup(options: Parameters<FakeChallengeWorld['client']>[1] = {}, userId: string | null = 'p1') {
    const world = new FakeChallengeWorld(() => T0);
    world.challenges = [goalChallenge(), event('ev')];
    let state: GameState = { ...initial, storage: { materials: { wood: 50 }, goods: { planks: 50 } } };
    const persist = vi.fn();
    const game: ChallengeGame = {
      state: () => state,
      apply: (command: Command) => {
        const result = dispatch(state, command, T0);
        if (!result.ok) return result.error.key;
        state = result.state;
        return null;
      },
      persist,
      canPlay: () => true,
    };
    const client = world.client(userId, options);
    const actions = createChallengeActions(client, challengeStore.getState(), () => challengeStore.getState(), game);
    return { world, client, actions, game, persist, current: () => state };
  }

  it('loads the snapshot', async () => {
    await setup().actions.refresh();
    expect(challengeStore.getState().status).toBe('ready');
    expect(challengeStore.getState().snapshot?.challenges).toHaveLength(2);
  });

  it('asks to sign in without an email or a Handle', async () => {
    await setup({ handle: false }).actions.refresh();
    expect(challengeStore.getState().status).toBe('sign-in-required');
    expect(challengeStore.getState().snapshot).toBeNull();
  });

  it('accepts a Challenge, reloads and starts it in the save', async () => {
    const { actions, current, persist } = setup();
    expect(await actions.accept('a')).toBe(true);
    expect(challengeStore.getState().snapshot?.accepted?.challengeId).toBe('a');
    expect(current().challenge).toMatchObject({ id: 'a', goal: GOAL, stock: {} });
    expect(persist).toHaveBeenCalled();
    expect(challengeStore.getState().busy).toBe(false);
  });

  it('records the refusal of a second acceptance', async () => {
    const { actions } = setup();
    await actions.accept('a');
    expect(await actions.accept('ev')).toBe(false);
    expect(challengeStore.getState().failure).toBe('challenge-busy');
  });

  it('goes offline on a network failure and keeps the last snapshot', async () => {
    const { actions, game } = setup();
    await actions.refresh();
    const reject = () => Promise.reject(new ChallengeError('offline'));
    await createChallengeActions({ list: reject, accept: reject, declare: reject }, challengeStore.getState(), () => challengeStore.getState(), game).poll();
    expect(challengeStore.getState().status).toBe('offline');
    expect(challengeStore.getState().snapshot).not.toBeNull();
  });

  it('pays twice the goal in Urbs when the last unit is set aside, and clears the Challenge', async () => {
    const { actions, current } = setup();
    await actions.accept('a');
    const urbs = current().urbs;
    expect(await actions.setAside('wood', 4)).toBeNull();
    expect(current().challenge).toBeDefined();
    expect(await actions.setAside('planks', 2)).toBeNull();
    expect(current().challenge).toBeUndefined();
    expect(current().urbs).toBe(urbs + challengeReward(GOAL));
    expect(current().storage.materials.wood).toBe(46);
    expect((await setupSnapshot(actions)).accepted).toBeNull();
  });

  it('pays nothing in Urbs for an Event and records the Medal', async () => {
    const { actions, current } = setup();
    await actions.accept('ev');
    const urbs = current().urbs;
    expect(await actions.setAside('wood', 5)).toBeNull();
    expect(current().challenge).toBeUndefined();
    expect(current().urbs).toBe(urbs);
    expect(challengeStore.getState().snapshot?.medals).toHaveLength(1);
  });

  it('returns the error of the core when setting aside too much', async () => {
    const { actions } = setup();
    await actions.accept('a');
    expect(await actions.setAside('wood', 5)).toBe('error.challengeSurplus');
    expect(await actions.setAside('stone', 1)).toBe('error.notInChallenge');
  });

  it('repairs a crash after the server completion: the next poll declares again and credits once', async () => {
    const { actions, client, current, game } = setup();
    await actions.accept('a');
    game.apply({ type: 'ChallengeSetAside', item: 'wood', quantity: 4 });
    game.apply({ type: 'ChallengeSetAside', item: 'planks', quantity: 2 });
    await client.declare('a');
    const state = current();
    expect(state.challenge).toBeDefined();
    await actions.poll();
    expect(current().challenge).toBeUndefined();
    const credited = current().urbs;
    expect(credited).toBe(state.urbs + challengeReward(GOAL));
    await actions.poll();
    expect(current().urbs).toBe(credited);
  });

  it('loses the stock of a Challenge the server expired', async () => {
    const world = new FakeChallengeWorld(() => now);
    let now = T0;
    world.challenges = [{ ...goalChallenge(), endsAt: T0 + 3 * DAY }];
    let state: GameState = { ...initial, storage: { materials: { wood: 50 }, goods: { planks: 50 } } };
    const game: ChallengeGame = { state: () => state, apply: (command) => { const result = dispatch(state, command, T0); if (!result.ok) return result.error.key; state = result.state; return null; }, persist: vi.fn(), canPlay: () => true };
    const actions = createChallengeActions(world.client('p1'), challengeStore.getState(), () => challengeStore.getState(), game);
    await actions.accept('a');
    await actions.setAside('wood', 2);
    now = T0 + DAY + 1;
    await actions.poll();
    expect(state.challenge).toBeUndefined();
    expect(state.storage.materials.wood).toBe(48);
  });

  it('does nothing in a read-only tab', async () => {
    const { actions, game } = setup();
    await actions.accept('a');
    const readOnly = createChallengeActions(await Promise.resolve(setup().client), challengeStore.getState(), () => challengeStore.getState(), { ...game, canPlay: () => false });
    expect(await readOnly.setAside('wood', 1)).toBe('error.noChallenge');
  });
});

async function setupSnapshot(actions: { poll: () => Promise<void> }) {
  await actions.poll();
  const snapshot = challengeStore.getState().snapshot;
  if (!snapshot) throw new Error('no snapshot');
  return snapshot;
}
