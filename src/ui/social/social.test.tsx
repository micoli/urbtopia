import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { ExchangesTab } from './ExchangesTab';
import { SocialTabs } from './SocialTabs';

const noop = () => {};

describe('social tabs', () => {
  it('lists the activities and marks the selected one', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" pending={0} onSelect={noop} />);
    expect(html).toContain(t('social.tab.friends'));
    expect(html).toContain(t('social.tab.exchanges'));
    expect(html).toMatch(/id="social-tab-exchanges"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="social-tab-friends"[^>]*aria-selected="false"/);
    expect(html).toContain('role="tablist"');
  });

  it('shows the pending count on the Friends tab, capped at 9+', () => {
    expect(renderToStaticMarkup(<SocialTabs tab="friends" pending={3} onSelect={noop} />)).toContain('>3<');
    expect(renderToStaticMarkup(<SocialTabs tab="friends" pending={12} onSelect={noop} />)).toContain('>9+<');
    expect(renderToStaticMarkup(<SocialTabs tab="friends" pending={0} onSelect={noop} />)).not.toContain('social-tab-badge');
  });

  it('announces that exchanges are coming', () => {
    expect(renderToStaticMarkup(<ExchangesTab />)).toContain(t('social.exchanges.soon'));
  });
});
