import { FIXTURE_IDS, FIXTURES, type FixtureId } from '../core';
import { MESSAGES } from '../i18n/messages';

// A page of the Codex is one piece that interiors share: every Fixture with the same English name belongs to the same page.
export interface FixturePage {
  id: string;
  fixtures: readonly FixtureId[];
}

const slugOf = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const nameOf = (id: FixtureId): string => MESSAGES[`venue.fixture.${id}`];

export const FIXTURE_PAGES: readonly FixturePage[] = (() => {
  const groups = new Map<string, FixtureId[]>();
  for (const id of FIXTURE_IDS) {
    const slug = slugOf(nameOf(id));
    groups.set(slug, [...(groups.get(slug) ?? []), id]);
  }
  return [...groups].map(([id, fixtures]) => ({ id, fixtures }));
})();

export const fixturePageOf = (pageId: string): FixturePage | undefined => FIXTURE_PAGES.find(page => page.id === pageId);

export const fixturePageIdOf = (fixture: FixtureId): string => FIXTURE_PAGES.find(page => page.fixtures.includes(fixture))!.id;

export const fixtureInteriorsOf = (page: FixturePage) => page.fixtures.map(id => ({ id, venue: FIXTURES[id].venue }));
