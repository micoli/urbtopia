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

const withLists = { friends: [{ userId: 'b', handle: 'Bob', avatar: null, since: 0, unread: 0, lastMessageAt: null, medals: [] }], incoming: [{ userId: 'c', handle: 'Carol', avatar: null, at: 0 }], outgoing: [{ userId: 'd', handle: 'Dave', avatar: null, at: 0 }], blocked: [{ userId: 'e', handle: 'Erin', avatar: null }] };

const profile: SocialState = {
  revision: 1,
  handle: 'Alice',
  avatar: null,
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
      status="ready"
      profile={profile}
      search={{ kind: 'idle' }}
      actionFailure={null}
      conversation={null}
      onOpenProfile={noop}
      onTrade={noop}
      actions={{ sendRequest: asyncNoop, accept: asyncNoop, refuse: asyncNoop, remove: asyncNoop, block: asyncNoop, openConversation: asyncNoop, closeConversation: asyncNoop, sendMessage: asyncNoop, refreshConversation: asyncNoop }}
      {...props}
    />,
  );

function storeOf(): Pick<SocialStore, 'setStatus' | 'setProfile' | 'setHandleForm' | 'setSearch' | 'setActionFailure' | 'setConversation' | 'setTrade'> {
  socialStore.setState({ status: 'idle', profile: null, handleForm: { kind: 'idle' }, search: { kind: 'idle' }, actionFailure: null, conversation: null });
  return socialStore.getState();
}

describe('friends panel', () => {
  it('sends a player without Handle to the Profile tab', () => {
    const html = panel({ profile: null, status: 'no-handle' });
    expect(html).toContain(t('friends.needHandle'));
    expect(html).toContain(t('friends.goToProfile'));
    expect(html).not.toContain('friends-handle');
  });

  it('keeps Handle, Avatar, findable toggle and sign-in out of the Friends tab', () => {
    const html = panel();
    expect(html).not.toContain(t('friends.findable'));
    expect(html).not.toContain(t('friends.handle.current'));
    expect(html).not.toContain(t('cloud.account.sendCode'));
  });

  it('lists requests and Friends by Handle, with their actions', () => {
    const html = panel({ profile: { ...profile, ...withLists } });
    for (const handle of ['Bob', 'Carol', 'Dave']) expect(html).toContain(`<strong>${handle}</strong>`);
    for (const key of ['friends.accept', 'friends.refuse', 'friends.cancel', 'friends.remove', 'friends.search.send'] as const) expect(html).toContain(t(key));
    expect(html).not.toContain('@example.com');
  });

  it('shows the Medals of a Friend and nothing for a Friend without any', () => {
    const medal = { medalCode: 'port-festival', nameFr: 'Fête du port', nameEn: 'Port festival', earnedAt: 1 };
    const [bob] = withLists.friends;
    if (!bob) throw new Error('no Friend');
    const html = panel({ profile: { ...profile, ...withLists, friends: [{ ...bob, medals: [medal] }] } });
    expect(html).toContain('Port festival');
    expect(panel({ profile: { ...profile, ...withLists } })).not.toContain('medal-list');
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

describe('Medals in the social state', () => {
  const medal = { medalCode: 'port-festival', nameFr: 'Fête du port', nameEn: 'Port festival', earnedAt: 1_700_000_000_000 };

  it('reaches a Friend through the fake client', async () => {
    const world = new FakeSocialWorld(() => 0);
    const alice = world.addPlayer('a');
    const bob = world.addPlayer('b');
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await alice.sendRequestByEmail('b@example.com');
    await bob.acceptRequest('a');
    world.giveMedal('a', medal);
    const snapshot = await bob.list();
    if (!snapshot.changed) throw new Error('unchanged');
    expect(snapshot.friends[0]?.medals).toEqual([medal]);
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
