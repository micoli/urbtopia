import { describe, expect, it } from 'vitest';
import { notesOfPulls } from './pullNotes';
import { withReleaseNote, type ReleaseNoteContent } from './releaseNote';

const NOTE: ReleaseNoteContent = {
  title: { en: '🏗️ A', fr: '🏗️ A' },
  items: { en: ['🏗️ **One**'], fr: ['🏗️ **Un**'] },
};

describe('notesOfPulls', () => {
  it('reads the note of each pull request and skips the ones without', () => {
    const { notes, unreadable } = notesOfPulls([{ number: 1, body: withReleaseNote('## Summary', NOTE) }, { number: 2, body: '## Summary only' }, { number: 3, body: null }]);
    expect(notes).toEqual([NOTE]);
    expect(unreadable).toEqual([]);
  });

  it('counts a pull request once', () => {
    const body = withReleaseNote(null, NOTE);
    expect(notesOfPulls([{ number: 1, body }, { number: 1, body }]).notes).toHaveLength(1);
  });

  it('reports a note block that cannot be read', () => {
    const { notes, unreadable } = notesOfPulls([{ number: 7, body: '<!-- urbtopia-release-note\n{not json\n-->\n<!-- /urbtopia-release-note -->' }]);
    expect(notes).toEqual([]);
    expect(unreadable).toEqual([7]);
  });
});
