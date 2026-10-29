import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/t';
import { SocialTabs } from './SocialTabs';

const noop = () => {};

function tabTag(html: string, id: string): string {
  return html.match(new RegExp(`<button[^>]*id="social-tab-${id}"[^>]*>`))![0];
}

describe('social tabs', () => {
  it('orders the tabs Friends, Groups, Exchanges, Profile', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" friendsPending={0} groupsPending={0} exchangesPending={0} onSelect={noop} />);
    const positions = ['friends', 'groups', 'exchanges', 'profile'].map((id) => html.indexOf(`social-tab-${id}`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((position) => position >= 0)).toBe(true);
  });

  it('shows the Groups badge on the selected tab and only that tab is active', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="groups" friendsPending={0} groupsPending={4} exchangesPending={0} onSelect={noop} />);
    expect(html).toMatch(/id="social-tab-groups"[\s\S]*count-badge[^>]*>4</);
    expect(tabTag(html, 'groups')).toContain('data-state="active"');
    expect(tabTag(html, 'friends')).toContain('data-state="inactive"');
  });

  it('lists the activities and marks the selected one', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="exchanges" friendsPending={0} groupsPending={0} exchangesPending={0} onSelect={noop} />);
    expect(html).toContain(t('social.tab.friends'));
    expect(html).toContain(t('social.tab.exchanges'));
    expect(tabTag(html, 'exchanges')).toContain('aria-selected="true"');
    expect(tabTag(html, 'friends')).toContain('aria-selected="false"');
    expect(tabTag(html, 'friends')).toContain('aria-controls="social-panel"');
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
