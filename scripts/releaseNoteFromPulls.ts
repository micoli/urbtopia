import { mergeReleaseNotes, styleProblems } from '../src/releaseNotes/releaseNote.ts';
import { notesOfPulls, type Pull } from '../src/releaseNotes/pullNotes.ts';
import { execFileSync } from 'node:child_process';
import { gh, publishOnRelease } from './releaseNoteGithub.ts';

const [tag] = process.argv.slice(2);
const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
if (!tag || !repository || !sha) {
  console.error('Usage: GITHUB_REPOSITORY=<owner/repo> GITHUB_SHA=<sha> node scripts/releaseNoteFromPulls.ts <release tag>');
  process.exit(1);
}

const lines = (output: string): string[] => output.split('\n').filter(Boolean);

// The release before this one, so that the release covers every commit pushed since: one per merge, the newest first.
const tags = lines(gh('release', 'list', '--repo', repository, '--exclude-drafts', '--limit', '30', '--json', 'tagName', '--jq', '.[].tagName'));
const previous = tags[tags.indexOf(tag) + 1];
const commits = previous ? lines(execFileSync('git', ['log', '--first-parent', '--format=%H', `${previous}..${sha}`], { encoding: 'utf8' })) : [sha];

const pulls: Pull[] = commits.flatMap(commit => {
  const found = gh('api', `repos/${repository}/commits/${commit}/pulls`, '--jq', '.[] | select(.merged_at != null) | {number, body} | @json');
  return lines(found).map(line => JSON.parse(line) as Pull);
});

const { notes, unreadable } = notesOfPulls(pulls);
for (const number of unreadable) console.warn(`Pull request ${number} has a release note block that cannot be read: skipped.`);

const note = mergeReleaseNotes(notes);
if (!note) {
  console.log(`No pull request of ${tag} carries a release note: the release keeps its generated notes.`);
  process.exit(0);
}

for (const problem of styleProblems(note)) console.warn(`Style: ${problem}`);
publishOnRelease(tag, note);
console.log(`Release note of ${tag} built from ${notes.length} pull request note(s), ${note.items.en.length} item(s).`);
