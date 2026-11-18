import { describe, expect, it } from 'vitest';
import { mergeReleaseNotes, parseReleaseNote, parseReleaseNoteContent, styleProblems, withReleaseNote, type ReleaseNoteContent } from './releaseNote';

const NOTE: ReleaseNoteContent = {
  title: { en: 'Rotate your venues', fr: 'Tournez vos salles' },
  items: { en: ['Two buttons rotate the room.'], fr: ['Deux boutons font tourner la salle.'] },
};

describe('parseReleaseNoteContent', () => {
  it('accepts a note written in both languages', () => {
    expect(parseReleaseNoteContent(NOTE)).toEqual(NOTE);
  });

  it.each([
    ['nothing', null],
    ['no french title', { ...NOTE, title: { en: 'a' } }],
    ['a blank title', { ...NOTE, title: { en: ' ', fr: 'a' } }],
    ['no item', { ...NOTE, items: { en: [], fr: [] } }],
    ['too many items', { ...NOTE, items: { en: Array(7).fill('x'), fr: Array(7).fill('x') } }],
    ['different counts', { ...NOTE, items: { en: ['x', 'y'], fr: ['x'] } }],
    ['an item that is not text', { ...NOTE, items: { en: [3], fr: ['x'] } }],
  ])('refuses %s', (_name, value) => {
    expect(parseReleaseNoteContent(value)).toBeNull();
  });
});

describe('a note longer than one pull request may write', () => {
  const long: ReleaseNoteContent = { ...NOTE, items: { en: Array.from({ length: 8 }, (_, index) => `item ${index}`), fr: Array.from({ length: 8 }, (_, index) => `élément ${index}`) } };

  it('is refused by default and accepted when the limit is lifted', () => {
    expect(parseReleaseNoteContent(long)).toBeNull();
    expect(parseReleaseNoteContent(long, Number.POSITIVE_INFINITY)).toEqual(long);
  });

  it('is read back from a release body', () => {
    expect(parseReleaseNote(withReleaseNote(null, long))).toEqual(long);
  });
});

describe('mergeReleaseNotes', () => {
  const second: ReleaseNoteContent = { title: { en: 'Second', fr: 'Seconde' }, items: { en: ['b1', 'b2'], fr: ['B1', 'B2'] } };
  const first: ReleaseNoteContent = { title: { en: 'First', fr: 'Première' }, items: { en: ['a1', 'b2'], fr: ['A1', 'B2'] } };

  it('has nothing to say without a note', () => {
    expect(mergeReleaseNotes([])).toBeNull();
  });

  it('keeps a single note as it is', () => {
    expect(mergeReleaseNotes([NOTE])).toEqual(NOTE);
  });

  it('takes the title of the newest note and every item, newest first, without repeating a sentence', () => {
    expect(mergeReleaseNotes([second, first])).toEqual({ title: second.title, items: { en: ['b1', 'b2', 'a1'], fr: ['B1', 'B2', 'A1'] } });
  });
});

describe('withReleaseNote', () => {
  it('writes a note a player can read back, above the generated notes', () => {
    const body = withReleaseNote("## What's Changed\n* a PR", NOTE);
    expect(parseReleaseNote(body)).toEqual(NOTE);
    expect(body).toContain('- Two buttons rotate the room.');
    expect(body.indexOf('urbtopia-release-note')).toBeLessThan(body.indexOf("What's Changed"));
  });

  it('replaces the previous note instead of piling up', () => {
    const next = { ...NOTE, title: { en: 'Other', fr: 'Autre' } };
    const body = withReleaseNote(withReleaseNote("## What's Changed", NOTE), next);
    expect(parseReleaseNote(body)).toEqual(next);
    expect(body.match(/<!-- urbtopia-release-note\n/g)).toHaveLength(1);
    expect(body).toContain("What's Changed");
    expect(body).not.toContain('Rotate your venues');
  });

  it('keeps a double dash from closing the comment', () => {
    const tricky = { ...NOTE, items: { en: ['a -- b --> c'], fr: ['a -- b --> c'] } };
    const body = withReleaseNote(null, tricky);
    expect(body.split('\n')[1]).not.toContain('--');
    expect(parseReleaseNote(body)).toEqual(tricky);
  });
});

describe('parseReleaseNote', () => {
  it('finds nothing in a release without a note', () => {
    expect(parseReleaseNote(null)).toBeNull();
    expect(parseReleaseNote("## What's Changed")).toBeNull();
  });

  it('finds nothing in a damaged note', () => {
    expect(parseReleaseNote('<!-- urbtopia-release-note\n{oops\n-->\n<!-- /urbtopia-release-note -->')).toBeNull();
  });
});

describe('styleProblems', () => {
  it('asks for an emoji and bold key words', () => {
    expect(styleProblems(NOTE)).toHaveLength(6);
  });

  it('has nothing to say about a note that leads with emojis and bolds its key words', () => {
    const styled: ReleaseNoteContent = {
      title: { en: '🍽️ Restaurants', fr: '🍽️ Restaurants' },
      items: { en: ['🍽️ A new **Restaurant** venue.'], fr: ['🍽️ Un nouveau lieu, le **restaurant**.'] },
    };
    expect(styleProblems(styled)).toEqual([]);
  });

  it('shows the language of each readable copy with a flag', () => {
    expect(withReleaseNote(null, NOTE)).toContain('## 🇬🇧 Rotate your venues');
    expect(withReleaseNote(null, NOTE)).toContain('## 🇫🇷 Tournez vos salles');
  });
});
