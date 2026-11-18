import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withReleaseNote, type ReleaseNoteContent } from '../src/releaseNotes/releaseNote.ts';

const MAX_OUTPUT = 64 * 1024 * 1024;

export const gh = (...args: string[]): string => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: MAX_OUTPUT });

function fileIn(directory: string, name: string, content: string): string {
  const path = join(directory, name);
  writeFileSync(path, content);
  return path;
}

// Puts the note in the body of the release (the generated notes stay below it) and attaches it as release-note.json.
export function publishOnRelease(tag: string, note: ReleaseNoteContent): void {
  const directory = mkdtempSync(join(tmpdir(), 'release-note-'));
  const body = gh('release', 'view', tag, '--json', 'body', '--jq', '.body');
  gh('release', 'edit', tag, '--notes-file', fileIn(directory, 'body.md', withReleaseNote(body, note)));
  gh('release', 'upload', tag, fileIn(directory, 'release-note.json', `${JSON.stringify(note, null, 2)}\n`), '--clobber');
}

// Puts the note in the body of a pull request, where the release picks it up once the pull request is merged.
export function publishOnPull(pull: string, note: ReleaseNoteContent): void {
  const directory = mkdtempSync(join(tmpdir(), 'release-note-'));
  const body = gh('pr', 'view', pull, '--json', 'body', '--jq', '.body');
  gh('pr', 'edit', pull, '--body-file', fileIn(directory, 'body.md', withReleaseNote(body, note)));
}
