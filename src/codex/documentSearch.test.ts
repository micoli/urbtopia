import { describe, expect, it } from 'vitest';
import { documentScore, rankDocuments } from './documentSearch';

const matches = (document: Parameters<typeof documentScore>[0], query: string) => documentScore(document, query) !== null;

describe('documentScore', () => {
  it('matches everything for an empty query', () => {
    expect(matches({ title: 'Bakery' }, '  ')).toBe(true);
  });

  it('matches whole words and word starts, ignoring case and accents', () => {
    expect(matches({ title: 'Électricité' }, 'electr')).toBe(true);
    expect(matches({ title: 'Recycling plant' }, 'PLANT')).toBe(true);
  });

  it('does not match in the middle of a word', () => {
    expect(matches({ title: 'Support' }, 'port')).toBe(false);
    expect(matches({ title: 'Bakery', summary: 'Sells bread to the hospitality sector' }, 'spit')).toBe(false);
  });

  it('forgives typos in long words of the title and the summary only', () => {
    expect(matches({ title: 'Bakery' }, 'bakary')).toBe(true);
    expect(matches({ title: 'Incinerator' }, 'incenerater')).toBe(true);
    expect(matches({ title: 'Farm' }, 'form')).toBe(false);
    expect(matches({ title: 'Cake' }, 'bake')).toBe(false);
    expect(matches({ title: 'Waste', body: 'The incinerator burns it' }, 'incenerator')).toBe(false);
  });

  it('searches the body text, with whole words and word starts only', () => {
    const document = { title: 'Waste', summary: 'Collection', body: 'Trucks drive to the Incinerator along roads.' };
    expect(matches(document, 'incinerator')).toBe(true);
    expect(matches(document, 'incin')).toBe(true);
    expect(matches(document, 'nerator')).toBe(false);
  });

  it('needs every term to match', () => {
    const document = { title: 'Waste', body: 'Trucks drive along roads' };
    expect(matches(document, 'waste roads')).toBe(true);
    expect(matches(document, 'waste hospital')).toBe(false);
  });

  it('scores the title above the summary above the body', () => {
    const title = documentScore({ title: 'Waste' }, 'waste')!;
    const summary = documentScore({ title: 'Home', summary: 'Waste' }, 'waste')!;
    const body = documentScore({ title: 'Home', body: 'Waste' }, 'waste')!;
    expect(title).toBeGreaterThan(summary);
    expect(summary).toBeGreaterThan(body);
  });
});

describe('rankDocuments', () => {
  it('sorts the best matches first and drops the others', () => {
    const items = [{ title: 'Home', body: 'waste' }, { title: 'Hospital' }, { title: 'Waste' }];
    expect(rankDocuments(items, item => item, 'waste').map(item => item.title)).toEqual(['Waste', 'Home']);
  });
});

describe('keywords', () => {
  it('weigh more than the summary and less than the title', () => {
    const keywords = documentScore({ title: 'Chains', keywords: 'Wood' }, 'wood')!;
    expect(keywords).toBeGreaterThan(documentScore({ title: 'Home', summary: 'Wood' }, 'wood')!);
    expect(keywords).toBeLessThan(documentScore({ title: 'Wood' }, 'wood')!);
  });
});
