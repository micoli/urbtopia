---
name: release-note
description: Write the Release note of a GitHub release for the players and publish it on that release, where the in-game "What's new" window reads it. Use after a merge into main has been deployed, or when the user asks for a release note or a what's new entry.
---

# Release note

A Release is created by CI on every push to `main`, after the deploy. Its note is published on the release itself, never committed: the game reads the body of the releases through the GitHub API.

## Steps

1. Pick the release: the tag the user names, else the latest (`gh release list --limit 2`). `git fetch --tags origin`. The previous release is the tag just below it.
2. Read what the release changed for players: `git log --first-parent <previous tag>..<tag>` and the PR titles (`gh pr view`). Read a diff only when a title is ambiguous.
3. Keep what a player sees or feels: new buildings, new rules, balance, fixes they would have noticed. Drop dependencies, CI, refactors, tests, docs, tooling. If nothing is left, publish no note and say so.
4. Use the words of `CONTEXT.md` (Citizens, Parcel, Club, Venue...). Never name a trademark of another game.
5. Write the note as a JSON file in the scratchpad directory, never in the repository:
   ```json
   {
     "title": { "en": "...", "fr": "..." },
     "items": { "en": ["..."], "fr": ["..."] }
   }
   ```
   - Title: 2 to 6 words, what the release is about, led by an emoji (`"🍽️ Restaurants and rotating rooms"`).
   - 1 to 6 items, one short sentence each, the same count in `en` and `fr`, the French written by hand and not a word-for-word copy.
   - Speak to the player, about the game, never about code.
   - **Make it easy to read at a glance.** Every item starts with an emoji that tells its topic (🏗️ building, 🚇 transport, ⚡ energy, 🌳 green, 🏟️ sport, ⚖️ balance, 🐛 fix, 🖥️ interface...), and puts its key words in `**bold**`. Example: `"🍽️ A new **Restaurant** venue is ready to build."`.
   - Markdown is limited to `**bold**`, `*italic*` and `` `code` `` (a key to press): the game renders those three and GitHub renders them too. No heading, list or link inside an item.
   - Order items from what players will notice most to what they will notice least.
6. Show the note to the user and wait for their yes: publishing edits a public release.
7. Publish it: `node scripts/publishReleaseNote.ts <tag> <note.json>`. The script prints a `Style:` warning for a title or an item without a leading emoji, and for an item without bold key words: fix the note and publish again. It puts the note in the release body (a hidden JSON block, a readable copy, the generated notes kept below) and attaches `release-note.json`. Running it again replaces the note.

The window opens for each player once, with the notes of the releases newer than the last one they saw (five at most). A new browser sees nothing. The game reads the body, not the attached file: a release file cannot be read from a browser (no CORS).
