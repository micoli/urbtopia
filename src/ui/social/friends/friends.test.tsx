import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FakeSocialWorld } from '../../../social/fakeSocialClient';
import { createSocialActions } from '../../../social/socialActions';
import { MESSAGES } from '../../../i18n/messages';
import { t } from '../../../i18n/t';
import { socialStore, type SocialStore } from '../../../store/socialStore';
import type { SocialState } from '../../../social/types';
import { friendsErrorMessage } from './friendsErrorMessage';
import { FriendsPanel } from './FriendsPanel';

const noop = () => {};
const asyncNoop = async () => {};
const DAY_MS = 86_400_000;

const withLists = { friends: [{ userId: 'b', handle: 'Bob', since: 0, unread: 0, lastMessageAt: null }], incoming: [{ userId: 'c', handle: 'Carol', at: 0 }], outgoing: [{ userId: 'd', handle: 'Dave', at: 0 }], blocked: [{ userId: 'e', handle: 'Erin' }] };

const profile: SocialState = {
  revision: 1,
  handle: 'Alice',
  findable: true,
  handleChangedAt: 0,
  friends: [],
  incoming: [],
  outgoing: [],
  blocked: [],
  offers: [],
};

const panel = (props: Partial<Parameters<typeof FriendsPanel>[0]> = {}) =>
  renderToStaticMarkup(
    <FriendsPanel
      account={{ userId: 'a', email: 'a@example.com' }}
      emailCode={{ kind: 'idle' }}
      status="ready"
      profile={profile}
      handleForm={{ kind: 'idle' }}
      now={0}
      changeDelayMs={30 * DAY_MS}
      search={{ kind: 'idle' }}
      actionFailure={null}
      conversation={null}
      codeActions={{ send: noop, verify: noop, cancel: noop }}
      actions={{ setHandle: asyncNoop, setFindable: asyncNoop, sendRequest: asyncNoop, accept: asyncNoop, refuse: asyncNoop, remove: asyncNoop, block: asyncNoop, unblock: asyncNoop, openConversation: asyncNoop, closeConversation: asyncNoop, sendMessage: asyncNoop }}
      {...props}
    />,
  );

function storeOf(): Pick<SocialStore, 'setStatus' | 'setProfile' | 'setHandleForm' | 'setSearch' | 'setActionFailure' | 'setConversation' | 'setTrade'> {
  socialStore.setState({ status: 'idle', profile: null, handleForm: { kind: 'idle' }, search: { kind: 'idle' }, actionFailure: null, conversation: null });
  return socialStore.getState();
}

describe('friends panel', () => {
  it('explains and offers the email flow to an anonymous account', () => {
    const html = panel({ account: { userId: 'a', email: null }, profile: null, status: 'idle' });
    expect(html).toContain(t('friends.needEmail'));
    expect(html).toContain(t('cloud.account.sendCode'));
  });

  it('asks for a Handle once the account has an email', () => {
    const html = panel({ profile: null, status: 'no-handle' });
    expect(html).toContain(t('friends.chooseHandle'));
    expect(html).toContain(t('friends.handle.choose'));
  });

  it('shows the Handle, the change delay and the findable toggle', () => {
    const html = panel({ now: 10 * DAY_MS });
    expect(html).toContain('<strong>Alice</strong>');
    expect(html).toContain(t('friends.handle.changeLater').replace('{N}', '20'));
    expect(html).toContain(t('friends.findable'));
    expect(html).toMatch(/type="checkbox"[^>]*checked/);
  });

  it('allows a change once the delay has passed', () => {
    const html = panel({ now: 31 * DAY_MS });
    expect(html).not.toContain(t('friends.handle.changeLater').replace('{N}', '1'));
    expect(html).not.toMatch(/<button[^>]*disabled/);
  });

  it('shows the error of a refused Handle', () => {
    const html = panel({ profile: null, status: 'no-handle', handleForm: { kind: 'error', error: 'handle-taken', retryAfterSeconds: null } });
    expect(html).toContain(t('friends.error.handle-taken'));
  });

  it('lists requests, Friends and blocked players by Handle, with their actions', () => {
    const html = panel({ profile: { ...profile, ...withLists } });
    for (const handle of ['Bob', 'Carol', 'Dave', 'Erin']) expect(html).toContain(`<strong>${handle}</strong>`);
    for (const key of ['friends.accept', 'friends.refuse', 'friends.cancel', 'friends.remove', 'friends.unblock', 'friends.search.send'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain('@example.com');
  });

  it('shows the neutral search confirmation and the rate limit delay', () => {
    expect(panel({ search: { kind: 'sent' } })).toContain(t('friends.search.sent'));
    expect(panel({ search: { kind: 'error', error: 'rate-limited', retryAfterSeconds: 125 } })).toContain(t('friends.error.rate-limited').replace('{N}', '3'));
  });

  it('shows cap errors', () => {
    expect(panel({ actionFailure: { error: 'cap-friends', retryAfterSeconds: null } })).toContain(t('friends.error.cap-friends'));
    expect(panel({ search: { kind: 'error', error: 'cap-outgoing', retryAfterSeconds: null } })).toContain(t('friends.error.cap-outgoing'));
  });

  it('says so when offline', () => {
    expect(panel({ status: 'offline', profile: null })).toContain(t('friends.offline'));
  });
});

describe('friends error messages', () => {
  it('turns the remaining delay into days', () => {
    expect(friendsErrorMessage('handle-change-too-soon', 3 * 86_400 + 5)).toBe(MESSAGES['friends.error.handle-change-too-soon'].replace('{N}', '4'));
  });

  it('falls back to a generic message', () => {
    expect(friendsErrorMessage('email-required', null)).toBe(MESSAGES['friends.error.unknown']);
  });
});

describe('social actions with the fake client', () => {
  function setup() {
    const world = new FakeSocialWorld(() => 0);
    const client = world.addPlayer('a');
    world.addPlayer('b', 'b@example.com', 'Bob');
    return createSocialActions(client, storeOf());
  }

  it('lands on the Handle step for an account without Handle', async () => {
    const actions = setup();
    await actions.refresh();
    expect(socialStore.getState().status).toBe('no-handle');
  });

  it('refuses a malformed Handle without calling the server', async () => {
    const actions = setup();
    await actions.setHandle('a!');
    expect(socialStore.getState().handleForm).toEqual({ kind: 'error', error: 'handle-invalid', retryAfterSeconds: null });
  });

  it('reports a taken Handle', async () => {
    const actions = setup();
    await actions.setHandle('bob');
    expect(socialStore.getState().handleForm).toMatchObject({ kind: 'error', error: 'handle-taken' });
  });

  it('saves a Handle, then loads the profile and toggles findable', async () => {
    const actions = setup();
    await actions.setHandle(' Alice ');
    expect(socialStore.getState()).toMatchObject({ status: 'ready', handleForm: { kind: 'idle' }, profile: { handle: 'Alice', findable: true } });
    await actions.setFindable(false);
    expect(socialStore.getState().profile?.findable).toBe(false);
  });

  it('reports the remaining days when the Handle changes too soon', async () => {
    const actions = setup();
    await actions.setHandle('Alice');
    await actions.setHandle('Alicia');
    const form = socialStore.getState().handleForm;
    expect(form).toMatchObject({ kind: 'error', error: 'handle-change-too-soon' });
    expect(form.kind === 'error' && form.retryAfterSeconds).toBe(30 * 86_400);
  });
});

describe('social actions: requests and Friends', () => {
  async function pair() {
    const world = new FakeSocialWorld(() => 0);
    const alice = world.addPlayer('a');
    const bob = world.addPlayer('b', 'b@example.com');
    const aliceStore = storeOf();
    const aliceActions = createSocialActions(alice, aliceStore);
    await aliceActions.setHandle('Alice');
    const bobActions = createSocialActions(bob, { ...aliceStore, setProfile: () => {}, setStatus: () => {} });
    await bobActions.setHandle('Bob');
    return { aliceActions, bobActions, world };
  }

  it('refuses a malformed email without calling the server', async () => {
    const { aliceActions } = await pair();
    await aliceActions.sendRequest('not-an-email');
    expect(socialStore.getState().search).toEqual({ kind: 'invalid-email' });
  });

  it('answers the same neutral way for a known and an unknown email', async () => {
    const { aliceActions } = await pair();
    await aliceActions.sendRequest('nobody@example.com');
    expect(socialStore.getState().search).toEqual({ kind: 'sent' });
    await aliceActions.sendRequest('b@example.com');
    expect(socialStore.getState().search).toEqual({ kind: 'sent' });
    expect(socialStore.getState().profile?.outgoing).toHaveLength(1);
  });

  it('reports the remaining delay once rate limited', async () => {
    const { aliceActions } = await pair();
    for (let i = 0; i < 10; i += 1) await aliceActions.sendRequest('nobody@example.com');
    await aliceActions.sendRequest('nobody@example.com');
    expect(socialStore.getState().search).toMatchObject({ kind: 'error', error: 'rate-limited', retryAfterSeconds: 3600 });
  });

  it('cancels an outgoing request', async () => {
    const { aliceActions } = await pair();
    await aliceActions.sendRequest('b@example.com');
    await aliceActions.refuse('b');
    expect(socialStore.getState().profile?.outgoing).toEqual([]);
  });

  it('accepts, removes, blocks and unblocks', async () => {
    const { aliceActions, bobActions } = await pair();
    await aliceActions.sendRequest('b@example.com');
    await bobActions.accept('a');
    await aliceActions.refresh();
    expect(socialStore.getState().profile?.friends).toMatchObject([{ handle: 'Bob' }]);
    await aliceActions.remove('b');
    expect(socialStore.getState().profile?.friends).toEqual([]);
    await aliceActions.block('b');
    expect(socialStore.getState().profile?.blocked).toMatchObject([{ handle: 'Bob' }]);
    await aliceActions.unblock('b');
    expect(socialStore.getState().profile?.blocked).toEqual([]);
  });

  it('keeps the failure of an action to show it', async () => {
    const { aliceActions } = await pair();
    await aliceActions.accept('b');
    expect(socialStore.getState().actionFailure).toMatchObject({ error: 'not-found' });
  });
});
