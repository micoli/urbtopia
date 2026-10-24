# Opt-out notice and toggle

Status: done - implemented
Blocked by: 02
Spec: ../spec.md

## What to build

The one-time notice shown on the first launch after release for accounts with a Handle, and the "Appear in the Hall of fame" toggle in the Social window (FR/EN).

## Acceptance criteria

- [ ] Notice explains the default, carries the toggle, and marks the notice seen on dismissal; nothing is published before.
- [ ] Toggle in the Social profile section, readable offline state shown, effective on the server at once; turning it off deletes the Showcase.
- [ ] Accounts without a Handle see neither notice nor toggle.
- [ ] Component tests and a Storybook story; one React component per file.
