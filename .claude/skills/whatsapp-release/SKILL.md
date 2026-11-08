---
name: whatsapp-release
description: Write a WhatsApp message for the users from the release notes not announced yet. Use when the user asks for the WhatsApp message, the announcement, or a message about the latest releases.
---

# WhatsApp release message

## Steps

1. Read the marker `.claude/last-announced` (untracked): the tag of the last release announced. If it is missing, ask the user for the tag, or announce the five latest.
2. List the releases newer than the marker: `gh release list --limit 20 --json tagName`. For each, read its body (`gh release view <tag> --json body --jq .body`): the note is the readable part between `<!-- urbtopia-release-note` and `<!-- /urbtopia-release-note -->`. Skip the releases without one, and tell the user which ones have none yet (run `/release-note` for them first).
3. Write one WhatsApp message in French: one hook line, then the items grouped by theme, `*bold*` for headings (WhatsApp bold is one star: turn the note's `**bold**` into `*bold*`), the emojis of the notes kept, `-` for bullets, short, no code words, no link unless the user gives one.
4. Print the message. Send nothing.
5. After the user's yes, write the tag of the newest release announced in `.claude/last-announced`.
