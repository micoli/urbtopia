import { describe, expect, it } from 'vitest';
import type { PublishedRelease } from './releaseNote';
import { hasUnseenNotes, notesOf } from './unseenNotes';

const withNote = (id: string): PublishedRelease => ({ id, publishedAt: `2026-11-0${id.length}T10:00:00Z`, note: { title: { en: id, fr: id }, items: { en: ['x'], fr: ['x'] } } });
const without = (id: string): PublishedRelease => ({ id, publishedAt: '2026-11-01T10:00:00Z', note: null });
const RELEASES = [withNote('c'), without('b'), withNote('a')];

describe('notesOf', () => {
  it('lists the notes newest first, with their release id and date, skipping releases without one', () => {
    expect(notesOf(RELEASES).map(note => note.id)).toEqual(['c', 'a']);
    expect(notesOf(RELEASES)[0]?.publishedAt).toBe('2026-11-01T10:00:00Z');
  });
});

describe('hasUnseenNotes', () => {
  it('is true when a release after the last seen one has a note', () => {
    expect(hasUnseenNotes(RELEASES, 'a')).toBe(true);
  });

  it('is false once everything is seen, when only releases without a note are newer, or when nothing is known', () => {
    expect(hasUnseenNotes(RELEASES, 'c')).toBe(false);
    expect(hasUnseenNotes([without('d'), ...RELEASES], 'c')).toBe(false);
    expect(hasUnseenNotes(RELEASES, null)).toBe(false);
  });

  it('counts every note when the last seen release is too old to be listed', () => {
    expect(hasUnseenNotes(RELEASES, 'gone')).toBe(true);
  });
});
