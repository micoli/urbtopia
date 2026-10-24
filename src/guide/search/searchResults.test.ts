import { describe, expect, it } from 'vitest';
import { searchIndexOf } from './searchIndex';
import { searchResults } from './searchResults';

const item = (title: string, summary = '') => ({ path: `${title}/`, title, summary, section: 'Codex' });

describe('searchResults', () => {
  it('ranks title matches before matches in the summary, ignoring accents', () => {
    const items = [item('Bakery', 'Turns électricité into bread'), item('Électricité')];
    expect(searchResults(items, 'electricite').map(result => result.title)).toEqual(['Électricité', 'Bakery']);
  });

  it('shows nothing for an empty query and at most twenty results', () => {
    const items = Array.from({ length: 30 }, (_, index) => item(`Home ${index}`));
    expect(searchResults(items, '  ')).toEqual([]);
    expect(searchResults(items, 'home')).toHaveLength(20);
  });

  it('finds Codex entries and Mechanics pages in each language', () => {
    expect(searchResults(searchIndexOf('fr'), 'ferme').map(result => result.path)).toContain('fr/codex/agriculture/farm/');
    expect(searchResults(searchIndexOf('en'), 'waste').map(result => result.path)).toContain('en/mechanics/waste/');
  });
});
