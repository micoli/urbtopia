import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseReleaseNoteContent, styleProblems, withReleaseNote } from '../src/releaseNotes/releaseNote.ts';

const [tag, notePath] = process.argv.slice(2);
if (!tag || !notePath) {
  console.error('Usage: node scripts/publishReleaseNote.ts <release tag> <note.json>');
  process.exit(1);
}

const note = parseReleaseNoteContent(JSON.parse(readFileSync(notePath, 'utf8')));
if (!note) {
  console.error('The note must have a title and 1 to 6 items in both "en" and "fr", the same number of items in each.');
  process.exit(1);
}

for (const problem of styleProblems(note)) console.warn(`Style: ${problem}`);

const gh = (...args: string[]): string => execFileSync('gh', args, { encoding: 'utf8' });
const directory = mkdtempSync(join(tmpdir(), 'release-note-'));

const body = gh('release', 'view', tag, '--json', 'body', '--jq', '.body');
const bodyFile = join(directory, 'body.md');
writeFileSync(bodyFile, withReleaseNote(body, note));
gh('release', 'edit', tag, '--notes-file', bodyFile);

const assetFile = join(directory, 'release-note.json');
writeFileSync(assetFile, `${JSON.stringify(note, null, 2)}\n`);
gh('release', 'upload', tag, assetFile, '--clobber');

console.log(`Release note published on ${tag}`);
