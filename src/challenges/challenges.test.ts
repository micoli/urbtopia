import { beforeEach, describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { challengeStore } from '../store/challengeStore';
import { createChallengeActions } from './challengeActions';
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

  function setup(options: Parameters<FakeChallengeWorld['client']>[1] = {}, userId: string | null = 'p1') {
    const world = new FakeChallengeWorld(() => T0);
    world.challenges = [daily('a', 'easy', 0), event('ev')];
    const actions = createChallengeActions(world.client(userId, options), challengeStore.getState(), () => challengeStore.getState());
    return { world, actions };
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

  it('accepts a Challenge and reloads', async () => {
    const { actions } = setup();
    expect(await actions.accept('a')).toBe(true);
    expect(challengeStore.getState().snapshot?.accepted?.challengeId).toBe('a');
    expect(challengeStore.getState().busy).toBe(false);
  });

  it('records the refusal of a second acceptance', async () => {
    const { actions } = setup();
    await actions.accept('a');
    expect(await actions.accept('ev')).toBe(false);
    expect(challengeStore.getState().failure).toBe('challenge-busy');
  });

  it('goes offline on a network failure and keeps the last snapshot', async () => {
    const { actions } = setup();
    await actions.refresh();
    const failing = createChallengeActions({ list: async () => Promise.reject(new ChallengeError('offline')), accept: async () => Promise.reject(new ChallengeError('offline')), declare: async () => Promise.reject(new ChallengeError('offline')) }, challengeStore.getState(), () => challengeStore.getState());
    await failing.poll();
    expect(challengeStore.getState().status).toBe('offline');
    expect(challengeStore.getState().snapshot).not.toBeNull();
  });
});
