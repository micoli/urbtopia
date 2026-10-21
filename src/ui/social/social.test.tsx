import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { SocialTabs } from './SocialTabs';

const noop = () => {};

describe('social tabs', () => {
  it('orders the tabs Friends, Groups, Exchanges, Profile', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" friendsPending={0} groupsPending={0} exchangesPending={0} onSelect={noop} />);
    const positions = ['friends', 'groups', 'exchanges', 'profile'].map((id) => html.indexOf(`social-tab-${id}`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((position) => position >= 0)).toBe(true);
  });

  it('shows the Groups badge and keeps only the selected tab in the tab order', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="groups" friendsPending={0} groupsPending={4} exchangesPending={0} onSelect={noop} />);
    expect(html).toMatch(/id="social-tab-groups"[^>]*tabindex="0"[\s\S]*count-badge[^>]*>4</);
    expect(html).toMatch(/id="social-tab-friends"[^>]*tabindex="-1"/);
  });

  it('lists the activities and marks the selected one', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" friendsPending={0} groupsPending={0} exchangesPending={0} onSelect={noop} />);
    expect(html).toContain(t('social.tab.friends'));
    expect(html).toContain(t('social.tab.exchanges'));
    expect(html).toMatch(/id="social-tab-exchanges"[^>]*aria-selected="true"/);
    expect(html).toMatch(/id="social-tab-friends"[^>]*aria-selected="false"/);
    expect(html).toContain('role="tablist"');
  });

  it('shows the pending count on each tab, capped at 9+', () => {
    expect(renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={3} groupsPending={0} exchangesPending={0} onSelect={noop} />)).toContain('>3<');
    expect(renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={12} groupsPending={0} exchangesPending={0} onSelect={noop} />)).toContain('>9+<');
    expect(renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={0} groupsPending={0} exchangesPending={0} onSelect={noop} />)).not.toContain('count-badge');
    const exchanges = renderToStaticMarkup(<SocialTabs tab="friends" friendsPending={0} groupsPending={0} exchangesPending={2} onSelect={noop} />);
    expect(exchanges).toMatch(/id="social-tab-exchanges"[\s\S]*count-badge[^>]*>2</);
  });
});
