import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../../i18n/t';
import type { SocialState } from '../../../social/types';
import { SignInPrompt } from '../SignInPrompt';
import { ProfilePanel } from './ProfilePanel';

const noop = () => {};
const asyncNoop = async () => {};
const DAY_MS = 86_400_000;

const profile: SocialState = {
  revision: 1,
  handle: 'Alice',
  avatar: null,
  findable: true,
  handleChangedAt: 0,
  friends: [],
  incoming: [],
  outgoing: [],
  blocked: [{ userId: 'e', handle: 'Erin', avatar: null }],
  offers: [],
};

const panel = (props: Partial<Parameters<typeof ProfilePanel>[0]> = {}) =>
  renderToStaticMarkup(
    <ProfilePanel
      account={{ userId: 'a', email: 'a@example.com' }}
      cloudStatus={{ kind: 'idle' }}
      status="ready"
      profile={profile}
      handleForm={{ kind: 'idle' }}
      medals={[]}
      now={0}
      changeDelayMs={30 * DAY_MS}
      onManageAccount={noop}
      actions={{ setHandle: asyncNoop, setAvatar: asyncNoop, setFindable: asyncNoop, unblock: asyncNoop }}
      {...props}
    />,
  );

describe('profile panel', () => {
  it('says the player has no Medal yet', () => {
    expect(panel()).toContain(t('medal.none'));
  });

  it('lists the Medals in the language of the player', () => {
    const medals = [{ medalCode: 'port-festival', nameFr: 'Fête du port', nameEn: 'Port festival', earnedAt: 1 }, { medalCode: 'harvest-week', nameFr: null, nameEn: null, earnedAt: 2 }];
    const html = panel({ medals });
    expect(html).toContain('Port festival');
    expect(html).toContain('Harvest week');
    expect(html).not.toContain(t('medal.none'));
  });

  it('asks for a Handle once the account has an email', () => {
    const html = panel({ profile: null, status: 'no-handle' });
    expect(html).toContain(t('friends.chooseHandle'));
    expect(html).toContain(t('friends.handle.choose'));
  });

  it('shows the error of a refused Handle', () => {
    const html = panel({ profile: null, status: 'no-handle', handleForm: { kind: 'error', error: 'handle-taken', retryAfterSeconds: null } });
    expect(html).toContain(t('friends.error.handle-taken'));
  });

  it('shows the Handle, the change delay, the findable toggle and the blocked players', () => {
    const html = panel({ now: 10 * DAY_MS });
    expect(html).toContain('<strong>Alice</strong>');
    expect(html).toContain(t('friends.handle.changeLater').replace('{N}', '20'));
    expect(html).toContain(t('friends.findable'));
    expect(html).toMatch(/type="checkbox"[^>]*checked/);
    expect(html).toContain('<strong>Erin</strong>');
    expect(html).toContain(t('friends.unblock'));
  });

  it('allows a Handle change once the delay has passed', () => {
    const html = panel({ now: 31 * DAY_MS });
    expect(html).not.toContain(t('friends.handle.changeLater').replace('{N}', '1'));
  });

  it('shows a read-only account block with a link to Settings, and no email form', () => {
    const html = panel();
    expect(html).toContain('a@example.com');
    expect(html).toContain(t('profile.account.manage'));
    expect(html).not.toContain('type="email"');
  });

  it('says so when offline, keeping the account block', () => {
    const html = panel({ status: 'offline', profile: null });
    expect(html).toContain(t('friends.offline'));
    expect(html).toContain(t('profile.account.manage'));
  });
});

describe('sign-in prompt', () => {
  it('states the benefit and points to Settings', () => {
    const html = renderToStaticMarkup(<SignInPrompt onSignIn={noop} />);
    expect(html).toContain(t('social.signIn.text'));
    expect(html).toContain(t('social.signIn.button'));
    expect(html).not.toContain('type="email"');
  });
});

describe('profile panel Hall of fame', () => {
  it('shows the opt-out toggle once the status is known', () => {
    expect(panel({ hallOfFame: { optedOut: false, onChange: noop } })).toContain(t('hall.optOut'));
  });

  it('hides it before the status is known', () => {
    expect(panel()).not.toContain(t('hall.optOut'));
  });
});
