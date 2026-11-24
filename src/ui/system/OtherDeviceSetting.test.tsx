import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { OtherDeviceSetting } from './OtherDeviceSetting';

const context = vi.hoisted(() => ({ enabled: true, email: null as string | null }));
vi.mock('../common/hooks', () => ({
  useCloud: (selector: (store: { enabled: boolean; account: { email: string | null } }) => unknown) => selector({ enabled: context.enabled, account: { email: context.email } }),
  useUi: (selector: (store: { setSettingsTab: () => void }) => unknown) => selector({ setSettingsTab: vi.fn() }),
}));

afterEach(() => {
  prefsStore.getState().setLanguage('en');
  context.enabled = true;
  context.email = null;
});

const render = () => renderToStaticMarkup(<OtherDeviceSetting />).replaceAll('&#x27;', "'");

describe('OtherDeviceSetting', () => {
  it.each(['en', 'fr'] as const)('offers to play on another device in %s from the first game', (language) => {
    prefsStore.getState().setLanguage(language);
    const html = render();
    expect(html).toContain(t('settings.otherDevice'));
    expect(html).toContain(t('settings.otherDevice.action'));
  });

  it('is hidden once an email is attached', () => {
    context.email = 'me@example.com';
    expect(render()).toBe('');
  });

  it('is hidden when the online service is not available', () => {
    context.enabled = false;
    expect(render()).toBe('');
  });
});
