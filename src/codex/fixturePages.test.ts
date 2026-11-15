import { describe, expect, it } from 'vitest';
import { FIXTURE_IDS, FIXTURES } from '../core';
import { factsOf, interiorRowsOf } from './fixtureFacts';
import { FIXTURE_PAGES, fixturePageIdOf, fixturePageOf } from './fixturePages';

describe('the Codex pages of the Fixtures', () => {
  it('gives every Fixture exactly one page, with a path of its own', () => {
    expect(FIXTURE_PAGES.flatMap(page => page.fixtures).sort()).toEqual([...FIXTURE_IDS].sort());
    expect(new Set(FIXTURE_PAGES.map(page => page.id)).size).toBe(FIXTURE_PAGES.length);
    for (const id of FIXTURE_IDS) expect(fixturePageOf(fixturePageIdOf(id))?.fixtures).toContain(id);
  });

  it('lists the interiors a piece shared by several of them goes in', () => {
    const gear = fixturePageOf('gear')!;
    expect(interiorRowsOf(gear).map(row => row.spec.venue)).toContain('bakery');
    expect(interiorRowsOf(gear).length).toBeGreaterThan(1);
  });

  it('draws what it says from the rules, grouping the interiors that read the same', () => {
    for (const page of FIXTURE_PAGES) {
      const facts = factsOf(page);
      expect(facts.flatMap(group => group.interiors).sort()).toEqual(page.fixtures.map(id => FIXTURES[id].venue).sort());
      for (const group of facts) expect(group.description.length).toBeGreaterThan(0);
    }
  });
});
