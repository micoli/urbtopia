import { parseReleaseNote, type ReleaseNoteContent } from './releaseNote.ts';

export interface Pull {
  number: number;
  body: string | null;
}

export interface PullNotes {
  notes: ReleaseNoteContent[];
  // The pull requests whose body holds a note block that cannot be read.
  unreadable: number[];
}

// The notes written in the bodies of pull requests, in the order given; a pull request counted once however many commits it brought.
export function notesOfPulls(pulls: readonly Pull[]): PullNotes {
  const notes: ReleaseNoteContent[] = [];
  const unreadable: number[] = [];
  const seen = new Set<number>();
  for (const pull of pulls) {
    if (seen.has(pull.number)) continue;
    seen.add(pull.number);
    const note = parseReleaseNote(pull.body);
    if (note) notes.push(note);
    else if (pull.body?.includes('<!-- urbtopia-release-note')) unreadable.push(pull.number);
  }
  return { notes, unreadable };
}
