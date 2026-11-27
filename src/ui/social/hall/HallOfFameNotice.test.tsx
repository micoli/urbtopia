import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../../../i18n/t';
import { HallOfFameNotice } from './HallOfFameNotice';

const context = vi.hoisted(() => ({ cloudStatus: 'synced', noticeSeen: false, member: true }));
vi.mock('../../common/hooks', () => ({
  useShowcase: (selector: (store: { status: { noticeSeen: boolean }; actions: object }) => unknown) => selector({ status: { noticeSeen: context.noticeSeen }, actions: {} }),
  useSocial: (selector: (store: { profile: object | null }) => unknown) => selector({ profile: context.member ? {} : null }),
  useCloud: (selector: (store: { status: { kind: string } }) => unknown) => selector({ status: { kind: context.cloudStatus } }),
}));

afterEach(() => {
  context.cloudStatus = 'synced';
  context.noticeSeen = false;
  context.member = true;
});

const render = () => renderToStaticMarkup(<HallOfFameNotice />);

describe('HallOfFameNotice', () => {
  it('is shown to a member who has not answered yet', () => {
    expect(render()).toContain(t('hall.notice.keep'));
  });

  it('is hidden while the player is choosing between the local and the cloud city', () => {
    context.cloudStatus = 'conflict';
    expect(render()).toBe('');
  });

  it('comes back once the choice is made', () => {
    context.cloudStatus = 'conflict';
    expect(render()).toBe('');
    context.cloudStatus = 'synced';
    expect(render()).toContain(t('hall.notice.keep'));
  });

  it('stays hidden once answered, and for a player who is not a member', () => {
    context.noticeSeen = true;
    expect(render()).toBe('');
    context.noticeSeen = false;
    context.member = false;
    expect(render()).toBe('');
  });
});
