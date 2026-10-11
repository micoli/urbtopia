import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { SocialTabs } from './SocialTabs';

const noop = () => {};

describe('social tabs', () => {
  it('puts Exchanges first and Friends last', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" friendsPending={0} exchangesPending={0} onSelect={noop} />);
    expect(html.indexOf('social-tab-exchanges')).toBeLessThan(html.indexOf('social-tab-friends'));
  });

  it('lists the activities and marks the selected one', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" friendsPending={0} exchangesPending={0} onSelect={noop} />);
    expect(html).toContain(t('social.tab.friends'));
    expect(html).toContain(t('social.tab.exchanges'));
    expect(html).toMatch(/id="social-tab-exchanges"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="social-tab-friends"[^>]*aria-selected="false"/);
    expect(html).toContain('role="tablist"');
  });

  it('shows the pending count on each tab, capped at 9+', () => {
    expect(renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={3} exchangesPending={0} onSelect={noop} />)).toContain('>3<');
    expect(renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={12} exchangesPending={0} onSelect={noop} />)).toContain('>9+<');
    expect(renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={0} exchangesPending={0} onSelect={noop} />)).not.toContain('social-tab-badge');
    const exchanges = renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={0} exchangesPending={2} onSelect={noop} />);
    expect(exchanges).toMatch(/id="social-tab-exchanges"[\s\S]*social-tab-badge[^>]*>2</);
  });
});
