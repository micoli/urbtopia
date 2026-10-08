import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { FIXTURE_CATEGORIES, FIXTURES, fixtureIdsInCategory, fixtureIdsOf, VENUE_TYPES } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { VenueBuildMenu } from './VenueBuildMenu';
import { VenueFixtureItem } from './VenueFixtureItem';

afterEach(() => {
  prefsStore.getState().setLanguage('en');
});

const html = (tier: number, type: (typeof VENUE_TYPES)[number]) => renderToStaticMarkup(<VenueBuildMenu tier={tier} venueType={type} />).replaceAll('&#x27;', "'");

describe('Venue categories', () => {
  it('put every Fixture in exactly one section of its own kind of Venue', () => {
    for (const type of VENUE_TYPES) {
      const listed = FIXTURE_CATEGORIES[type].flatMap(category => fixtureIdsInCategory(type, category));
      expect([...listed].sort()).toEqual([...fixtureIdsOf(type)].sort());
      for (const category of FIXTURE_CATEGORIES[type]) expect(fixtureIdsInCategory(type, category).length).toBeGreaterThan(0);
      for (const id of fixtureIdsOf(type)) expect(FIXTURE_CATEGORIES[type]).toContain(FIXTURES[id].category);
    }
  });
});

describe('Venue build menu', () => {
  it.each(['en', 'fr'] as const)('lists the sections of an Arcade, games first, in %s', language => {
    prefsStore.getState().setLanguage(language);
    const sections = html(1, 'arcade').match(/<section\b[^>]*aria-label="[^"]*"[^>]*>[\s\S]*?<\/section>/g) ?? [];
    expect(sections.filter(section => section.includes('build-section'))).toHaveLength(3);
    expect(sections[0]).toContain(t('venue.build'));
    expect(html(1, 'arcade').indexOf(t('venue.category.games'))).toBeLessThan(html(1, 'arcade').indexOf(t('venue.category.furniture')));
  });

  it('opens the first section and keeps the others closed, like the city menu', () => {
    const markup = html(1, 'arcade');
    expect(markup).toContain(t('venue.fixture.barrelClimber'));
    expect(markup).toMatch(new RegExp(`aria-expanded="true"[^>]*>\\s*<span>${t('venue.category.games')}`));
    expect(markup).toMatch(new RegExp(`aria-expanded="false"[^>]*>\\s*<span>${t('venue.category.furniture')}`));
  });

  it('shows the cost of an item, and locks the ones above the Tier with the Tier they need', () => {
    const markup = html(1, 'arcade');
    expect(markup).toContain(`>${FIXTURES.barrelClimber.price}`);
    const pinball = markup.match(new RegExp(`<button[^>]*flyout-item[^>]*>\\s*<span>${t('venue.fixture.pinball')}</span>[\\s\\S]*?</button>`))?.[0] ?? '';
    expect(pinball).toContain('disabled');
    expect(pinball).toContain(`${t('venue.tierNeeded')} 2`);
    const open = html(2, 'arcade').match(new RegExp(`<button[^>]*flyout-item[^>]*>\\s*<span>${t('venue.fixture.pinball')}</span>[\\s\\S]*?</button>`))?.[0] ?? '';
    expect(open).not.toContain('disabled');
  });

  it('marks the selected item', () => {
    const row = (selected: boolean) => renderToStaticMarkup(<VenueFixtureItem id="spaceShooter" tier={1} selected={selected} onChoose={() => {}} />);
    expect(row(true)).toContain('data-selected="true"');
    expect(row(false)).not.toContain('data-selected="true"');
    expect(html(1, 'arcade')).toContain(t('venue.chooseFixture'));
  });

  it('has its own sections for a Supermarket and a Hotel', () => {
    expect(html(1, 'supermarket')).toContain(t('venue.category.shelves'));
    expect(html(1, 'supermarket')).toContain(t('venue.fixture.shelfBags'));
    expect(html(1, 'hotel')).toContain(t('venue.category.beds'));
    expect(html(1, 'hotel')).toContain(t('venue.fixture.singleBed'));
    expect(html(1, 'hotel')).not.toContain(t('venue.fixture.barrelClimber'));
  });
});
