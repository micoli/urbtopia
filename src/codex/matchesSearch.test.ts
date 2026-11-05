import { describe, expect, it } from 'vitest';
import { matchesSearch, searchMatch } from './matchesSearch';

describe('matchesSearch', () => {
  it('matches everything for an empty query', () => {
    expect(matchesSearch('Bakery', '  ')).toBe(true);
  });

  it('ignores case and accents, in the query and in the text', () => {
    expect(matchesSearch('Électricité', 'electricite')).toBe(true);
    expect(matchesSearch('Electricite', 'ÉLECTRICITÉ')).toBe(true);
    expect(matchesSearch('Boulangerie', 'bouléngerie')).toBe(true);
  });

  it('ignores apostrophes', () => {
    expect(matchesSearch('Centrale à l’énergie', 'lenergie')).toBe(true);
  });

  it('forgives a wrong, missing, extra or swapped letter in a word of four letters or more', () => {
    expect(matchesSearch('Bakery', 'bakary')).toBe(true);
    expect(matchesSearch('Bakery', 'bakry')).toBe(true);
    expect(matchesSearch('Bakery', 'bakeery')).toBe(true);
    expect(matchesSearch('Bakery', 'bakrey')).toBe(true);
    expect(matchesSearch('Incinérateur', 'incinerateure')).toBe(true);
  });

  it('forgives a typo in a half-typed word', () => {
    expect(matchesSearch('Recycling plant', 'recyclng pl')).toBe(true);
    expect(matchesSearch('Boulangerie', 'boulagn')).toBe(true);
  });

  it('forgives two errors only in long words', () => {
    expect(matchesSearch('Incinerator', 'incenerater')).toBe(true);
    expect(matchesSearch('Bakery', 'bkary')).toBe(false);
  });

  it('keeps short terms exact', () => {
    expect(matchesSearch('Home', 'hxm')).toBe(false);
    expect(matchesSearch('Mound', 'mo')).toBe(true);
  });

  it('needs every term to match', () => {
    expect(matchesSearch('Recycling plant', 'recicling plant')).toBe(true);
    expect(matchesSearch('Recycling plant', 'recicling hospital')).toBe(false);
  });

  it('rejects unrelated words', () => {
    expect(matchesSearch('Bakery', 'hospital')).toBe(false);
  });
});

describe('searchMatch', () => {
  it('tells an exact match from a fuzzy one', () => {
    expect(searchMatch('Bakery', 'bake')).toBe('exact');
    expect(searchMatch('Bakery', 'bakary')).toBe('fuzzy');
    expect(searchMatch('Bakery', 'hospital')).toBeNull();
  });
});
