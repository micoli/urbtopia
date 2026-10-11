import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FakeSocialWorld } from '../../../../social/fakeSocialClient';
import { createSocialActions } from '../../../../social/socialActions';
import { MESSAGES } from '../../../../i18n/messages';
import { t } from '../../../../i18n/t';
import { socialStore, type SocialStore } from '../../../../store/socialStore';
import type { SocialState } from '../../../../social/types';
import { friendsErrorMessage } from './friendsErrorMessage';
import { FriendsPanel } from './FriendsPanel';

const noop = () => {};
const DAY_MS = 86_400_000;

const profile: SocialState = {
  revision: 1,
  handle: 'Alice',
  findable: true,
  handleChangedAt: 0,
  friends: [],
  incoming: [],
  outgoing: [],
  blocked: [],
};

const panel = (props: Partial<Parameters<typeof FriendsPanel>[0]> = {}) =>
  renderToStaticMarkup(
    <FriendsPanel
      account={{ userId: 'a', email: 'a@example.com' }}
      emailLink={{ kind: 'idle' }}
      status="ready"
      profile={profile}
      handleForm={{ kind: 'idle' }}
      now={0}
      changeDelayMs={30 * DAY_MS}
      onSendLink={noop}
      onSetHandle={noop}
      onSetFindable={noop}
      {...props}
    />,
  );

function storeOf(): Pick<SocialStore, 'setStatus' | 'setProfile' | 'setHandleForm'> {
  socialStore.setState({ status: 'idle', profile: null, handleForm: { kind: 'idle' } });
  return socialStore.getState();
}

describe('friends panel', () => {
  it('explains and offers the email flow to an anonymous account', () => {
    const html = panel({ account: { userId: 'a', email: null }, profile: null, status: 'idle' });
    expect(html).toContain(t('friends.needEmail'));
    expect(html).toContain(t('cloud.account.sendLink'));
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

  it('says so when offline', () => {
    expect(panel({ status: 'offline', profile: null })).toContain(t('friends.offline'));
  });
});

describe('friends error messages', () => {
  it('turns the remaining delay into days', () => {
    expect(friendsErrorMessage('handle-change-too-soon', 3 * 86_400 + 5)).toBe(MESSAGES['friends.error.handle-change-too-soon'].replace('{N}', '4'));
  });

  it('falls back to a generic message', () => {
    expect(friendsErrorMessage('cap-friends', null)).toBe(MESSAGES['friends.error.unknown']);
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
