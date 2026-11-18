import { readFileSync } from 'node:fs';
import { parseReleaseNoteContent, styleProblems } from '../src/releaseNotes/releaseNote.ts';
import { publishOnPull } from './releaseNoteGithub.ts';

const [pull, notePath] = process.argv.slice(2);
if (!pull || !notePath) {
  console.error('Usage: node scripts/publishPullNote.ts <pull request number or url> <note.json>');
  process.exit(1);
}

const note = parseReleaseNoteContent(JSON.parse(readFileSync(notePath, 'utf8')));
if (!note) {
  console.error('The note must have a title and 1 to 6 items in both "en" and "fr", the same number of items in each.');
  process.exit(1);
}

for (const problem of styleProblems(note)) console.warn(`Style: ${problem}`);

publishOnPull(pull, note);
console.log(`Release note written in the body of pull request ${pull}`);
