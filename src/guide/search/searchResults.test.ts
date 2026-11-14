import { describe, expect, it } from 'vitest';
import { searchIndexOf } from './searchIndex';
import { searchResults } from './searchResults';

const item = (title: string, summary = '') => ({ path: `${title}/`, title, summary, section: 'Codex' });

describe('searchResults', () => {
  it('ranks title matches before matches in the summary, ignoring accents', () => {
    const items = [item('Bakery', 'Turns électricité into bread'), item('Électricité')];
    expect(searchResults(items, 'electricite').map(result => result.title)).toEqual(['Électricité', 'Bakery']);
  });

  it('forgives typos and puts exact matches first', () => {
    const items = [item('Boulangerie'), item('Bakery', 'The boulanger sells bread')];
    expect(searchResults(items, 'boulangrie').map(result => result.title)).toEqual(['Boulangerie']);
    expect(searchResults(items, 'bakary').map(result => result.title)).toEqual(['Bakery']);
    expect(searchResults(items, 'boulanger').map(result => result.title)).toEqual(['Boulangerie', 'Bakery']);
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

describe('searchResults in the page texts', () => {
  it('finds a word that appears only in the body of an article', () => {
    const items = [{ path: 'a/', title: 'Waste', summary: 'Collection', section: 'Mechanics', body: 'Trucks reach the Incinerator by road.' }, item('Bakery')];
    expect(searchResults(items, 'incinerator').map(result => result.path)).toEqual(['a/']);
    expect(searchResults(items, 'cinerator')).toEqual([]);
  });
});

describe('searchResults for the production chains', () => {
  it('finds the production chains page from an item it shows', () => {
    expect(searchResults(searchIndexOf('fr'), 'planche').map(result => result.path)).toContain('fr/mechanics/chains/');
    expect(searchResults(searchIndexOf('fr'), 'bois').map(result => result.path)).toContain('fr/mechanics/chains/');
  });
});
