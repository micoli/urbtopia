import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../i18n/messages';
import { FIXTURE_CATEGORIES, FIXTURE_IDS, FIXTURES, fixtureIdsInCategory, type FixtureVenue } from './fixtures';

const sorted = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sorted);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sorted(item)]));
};

const lines = (rows: readonly unknown[]): string => `${rows.map(row => JSON.stringify(sorted(row))).join('\n')}\n`;

describe('the resolved registry of the Fixtures', () => {
  it('resolves every Fixture to the same spec, in the same order', async () => {
    await expect(lines(FIXTURE_IDS.map(id => [id, FIXTURES[id]]))).toMatchFileSnapshot('./__golden__/fixtureSpecs.jsonl');
  });

  it('names every Fixture the same way', async () => {
    await expect(lines(FIXTURE_IDS.map(id => [id, MESSAGES[`venue.fixture.${id}`]]))).toMatchFileSnapshot('./__golden__/fixtureNames.jsonl');
  });

  it('lays out the build menu of every Venue the same way', async () => {
    const venues = Object.keys(FIXTURE_CATEGORIES) as FixtureVenue[];
    const menu = venues.map(venue => [venue, FIXTURE_CATEGORIES[venue].map(category => [category, fixtureIdsInCategory(venue, category)])]);
    await expect(lines(menu)).toMatchFileSnapshot('./__golden__/fixtureMenus.jsonl');
  });
});
