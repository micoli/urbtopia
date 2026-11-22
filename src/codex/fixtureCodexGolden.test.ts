import { describe, expect, it } from 'vitest';
import { factsOf, interiorRowsOf } from './fixtureFacts';
import { FIXTURE_PAGES } from './fixturePages';

const lines = (rows: readonly unknown[]): string => `${rows.map(row => JSON.stringify(row)).join('\n')}\n`;

describe('the Codex pages of the Fixtures, as drawn from the data', () => {
  it('groups the Fixtures into the same pages', async () => {
    await expect(lines(FIXTURE_PAGES.map(page => [page.id, page.fixtures]))).toMatchFileSnapshot('./__golden__/fixturePages.jsonl');
  });

  it('states the same facts on every page', async () => {
    await expect(lines(FIXTURE_PAGES.map(page => [page.id, factsOf(page)]))).toMatchFileSnapshot('./__golden__/fixtureFacts.jsonl');
  });

  it('shows the same figures on every row of the interiors table', async () => {
    await expect(lines(FIXTURE_PAGES.flatMap(page => interiorRowsOf(page).map(row => [row.id, row.figures])))).toMatchFileSnapshot('./__golden__/fixtureFigures.jsonl');
  });
});
