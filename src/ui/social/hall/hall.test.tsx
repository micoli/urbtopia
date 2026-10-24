import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '../../../i18n/t';
import type { HallOfFameEntry } from '../../../showcase/types';
import { VisitBannerView } from '../../system/VisitBannerView';
import { SocialTabs } from '../SocialTabs';
import { HallOfFameList } from './HallOfFameList';
import { HallOfFameNoticeView } from './HallOfFameNoticeView';
import { HallOfFameToggle } from './HallOfFameToggle';

const noop = () => {};
const entries: HallOfFameEntry[] = [
  { rank: 1, userId: 'u1', handle: 'Alice', avatar: null, citizens: 1200 },
  { rank: 2, userId: 'u2', handle: 'Bob', avatar: 'character-male-a', citizens: 900 },
];

const list = (props: Partial<Parameters<typeof HallOfFameList>[0]> = {}) =>
  renderToStaticMarkup(<HallOfFameList state="ready" entries={entries} ownUserId={null} visitBusy={false} visitFailure={null} onVisit={noop} onRefresh={noop} {...props} />);

describe('Hall of fame list', () => {
  it('shows rank, Handle, Citizens and a Visit button for each entry', () => {
    const html = list();
    expect(html).toContain('Alice');
    expect(html).toContain('Bob');
    expect(html).toContain(t('hall.citizens').replace('{N}', '1200'));
    expect(html.match(new RegExp(`>${t('hall.visit')}<`, 'g'))).toHaveLength(2);
  });

  it('marks the entry of the player', () => {
    expect(list({ ownUserId: 'u2' })).toContain(t('hall.you'));
    expect(list()).not.toContain(t('hall.you'));
  });

  it('says so when nobody is ranked yet', () => {
    expect(list({ entries: [] })).toContain(t('hall.empty'));
  });

  it('tells the player they are offline', () => {
    expect(list({ state: 'offline', entries: [] })).toContain(t('hall.offline'));
  });

  it('explains why a Visit failed', () => {
    expect(list({ visitFailure: 'newer-version' })).toContain(t('visit.fail.newer-version'));
  });

  it('disables the Visit buttons while a city is opening', () => {
    expect(list({ visitBusy: true })).toContain('disabled');
  });

  it('carries no Medals', () => {
    expect(list()).not.toContain('medal-list');
  });
});

describe('Hall of fame toggle', () => {
  it('is checked by default, since the player is in unless they opt out', () => {
    expect(renderToStaticMarkup(<HallOfFameToggle optedOut={false} onChange={noop} />)).toContain('checked');
  });

  it('is unchecked once the player opted out', () => {
    expect(renderToStaticMarkup(<HallOfFameToggle optedOut onChange={noop} />)).not.toContain('checked');
  });
});

describe('Hall of fame notice', () => {
  it('offers to keep the city in or to opt out', () => {
    const html = renderToStaticMarkup(<HallOfFameNoticeView onKeep={noop} onOptOut={noop} />);
    expect(html).toContain(t('hall.notice.keep'));
    expect(html).toContain(t('hall.notice.optOut'));
  });
});

describe('Visit banner', () => {
  it('names the visited Handle and offers to leave', () => {
    const html = renderToStaticMarkup(<VisitBannerView handle="Bob" onLeave={noop} />);
    expect(html).toContain('Bob');
    expect(html).toContain(t('visit.leave'));
  });
});

describe('Social tabs', () => {
  it('includes the Hall of fame', () => {
    const html = renderToStaticMarkup(<SocialTabs tab="hall" friendsPending={0} groupsPending={0} exchangesPending={0} onSelect={noop} />);
    expect(html).toContain(t('social.tab.hall'));
  });
});
