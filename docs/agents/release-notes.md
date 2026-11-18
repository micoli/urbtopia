# Release notes

A Release note is not in the repository: it is prepared in the body of its pull request, and it lives in the body of its GitHub release (a hidden `<!-- urbtopia-release-note ... -->` JSON block, FR and EN) and as the file `release-note.json` attached to it. The `release-note` skill writes it, before the merge into the pull request with `node scripts/publishPullNote.ts <pull request> <note.json>`, or after the deploy on the release with `node scripts/publishReleaseNote.ts <tag> <note.json>`. A note leads its title and each item with an emoji and bolds the key words (`**bold**`, `*italic*` and `` `code` `` are rendered by the game and by GitHub); the script warns when it does not.

## From the pull request to the release

```text
/release-note on a pull request   -> hidden block in the pull request body (1 to 6 items)
merge into main                   -> CI deploys, then creates the release
release job                       -> node scripts/releaseNoteFromPulls.ts <tag>
                                       first-parent commits since the previous release
                                       -> the merged pull request of each commit
                                       -> the notes in their bodies, newest first
                                       -> merged: title of the newest, every item, a repeated sentence once
                                       -> published on the release (body and release-note.json)
no pull request carries a note    -> the release keeps its generated notes; the skill can still publish one afterwards
```

A pull request whose note block cannot be read is skipped with a warning in the job log. Publishing with the skill after the deploy replaces the note the CI built. The release job needs `pull-requests: read` and a checkout with the history and the tags.

The game reads `api.github.com/repos/micoli/urbtopia/releases` (CORS open, 60 requests an hour per IP; a release file itself cannot be read from a browser) and opens a window when a release the player has not seen has a note. The window shows one note at a time with its release date and time, newest first, and Older and Newer buttons walk through the notes of the 100 latest releases. The last seen tag is in `localStorage['urbtopia-release-notes-seen']`; a browser with nothing stored starts on the latest release, and `?e2e` never calls GitHub. A Playwright test of the window routes that URL to a fake list and sets that key to an older tag, without `?e2e`. The `whatsapp-release` skill turns the notes not announced yet into a WhatsApp message.
