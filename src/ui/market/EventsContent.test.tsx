import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Challenge, ChallengeSnapshot } from '../../challenges/types';
import { dispatch, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import type { ChallengeStore } from '../../store/challengeStore';
import { EventsContent } from './EventsContent';

const T0 = 1_700_000_000_000;
const context = vi.hoisted(() => ({ state: null as GameState | null, challenges: null as Partial<ChallengeStore> | null }));

vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
  useChallenges: (selector: (store: Partial<ChallengeStore>) => unknown) => selector(context.challenges!),
  useUi: (selector: (store: { openSettingsFromSocial: () => void }) => unknown) => selector({ openSettingsFromSocial: () => {} }),
}));
vi.mock('../common/ItemIcon', () => ({ ItemIcon: () => null }));

afterEach(() => prefsStore.getState().setLanguage('en'));

const base: Challenge = { id: 'c1', kind: 'daily', difficulty: 'easy', minCitizens: 0, goal: [{ item: 'wood', quantity: 20 }, { item: 'stone', quantity: 10 }], rewardKind: 'urbs', medalCode: null, nameKeys: { hook: 0, item: 'wood' }, nameFr: null, nameEn: null, startsAt: T0 - 1000, endsAt: T0 + 86_400_000 };
const medal: Challenge = { ...base, id: 'ev', kind: 'event', difficulty: null, rewardKind: 'medal', medalCode: 'port-festival', nameEn: 'Port festival', nameFr: 'Fête du port' };

function snapshot(overrides: Partial<ChallengeSnapshot> = {}): ChallengeSnapshot {
  return { serverNow: T0, challenges: [base, medal], accepted: null, abandoned: [], medals: [], ...overrides };
}

function render(challenges: Partial<ChallengeStore>, state: GameState = newGame({ seed: 'amber-fox-4821', now: T0 })): string {
  context.state = state;
  context.challenges = { enabled: true, status: 'ready', snapshot: snapshot(), clockOffset: 0, busy: false, failure: null, actions: null, ...challenges };
  return renderToStaticMarkup(<EventsContent />);
}

describe('EventsContent', () => {
  it('says Challenges need an online game when the cloud is off', () => {
    expect(render({ enabled: false })).toContain('Challenges need an online game.');
  });

  it('links to the Codex page of Challenges in every state', () => {
    expect(render({})).toContain('How Challenges work');
    expect(render({ enabled: false })).toContain('How Challenges work');
    expect(render({ status: 'loading', snapshot: null })).toContain('How Challenges work');
    expect(render({ status: 'sign-in-required', snapshot: null })).toContain('How Challenges work');
  });

  it('asks to sign in', () => {
    expect(render({ status: 'sign-in-required', snapshot: null })).toContain('social-sign-in');
  });

  it('shows a loading message before the first snapshot', () => {
    expect(render({ status: 'loading', snapshot: null })).toContain('Loading the Challenges');
  });

  it('lists the Challenges of the city with their reward', () => {
    const html = render({});
    expect(html).toContain('Daily challenge · Easy');
    expect(html).toContain('Port festival');
    expect(html).toContain('Reward: a Medal');
    expect(html).toContain('Reward: 200');
    expect((html.match(/>Accept</g) ?? []).length).toBe(2);
  });

  it('writes in French', () => {
    prefsStore.getState().setLanguage('fr');
    const html = render({});
    expect(html).toContain('Défi du jour · Facile');
    expect(html).toContain('Fête du port');
    expect(html).toContain('Accepter');
  });

  it('says nothing is available when the city unlocks no Challenge', () => {
    expect(render({ snapshot: snapshot({ challenges: [{ ...base, minCitizens: 600 }] }) })).toContain('No Challenge for your city right now.');
  });

  it('shows the accepted Challenge with its progress and blocks the others', () => {
    const started = dispatch(newGame({ seed: 'amber-fox-4821', now: T0 }), { type: 'ChallengeStart', id: 'c1', goal: base.goal, deadline: T0 + 3_600_000 }, T0);
    if (!started.ok) throw new Error(started.error.key);
    const html = render({ snapshot: snapshot({ accepted: { challengeId: 'c1', acceptedAt: T0, deadline: T0 + 3_600_000 } }) }, started.state);
    expect(html).toContain('In progress');
    expect(html).toContain('0 / 20');
    expect(html).toContain('Time cannot be skipped while a Challenge is in progress.');
    expect(html).toContain('Finish your current Challenge first.');
  });

  it('offers to set aside what the Storehouse holds', () => {
    const base0 = newGame({ seed: 'amber-fox-4821', now: T0 });
    const started = dispatch({ ...base0, storage: { materials: { wood: 7 }, goods: {} } }, { type: 'ChallengeStart', id: 'c1', goal: base.goal, deadline: T0 + 3_600_000 }, T0);
    if (!started.ok) throw new Error(started.error.key);
    const html = render({ snapshot: snapshot({ accepted: { challengeId: 'c1', acceptedAt: T0, deadline: T0 + 3_600_000 } }) }, started.state);
    expect(html).toContain('Set aside 7');
  });

  it('shows the failure of an action and the offline warning', () => {
    const html = render({ failure: 'challenge-busy', status: 'offline' });
    expect(html).toContain('Another Challenge is already in progress.');
    expect(html).toContain('Offline');
  });
});
