# Play on another device entry

Status: ready-for-agent
Spec: ../spec.md
Blocked by: none

## What to build

A permanent entry "Play on another device" in the system menu opens the sign-in by typed code. The 200-Citizens prompt and its 12 h snooze (`shouldPromptSignIn`) stay as they are.

## Acceptance criteria

- [ ] The entry is visible from the first game, hidden when an email is already attached.
- [ ] It opens the existing sign-in by code (ADR 0027) with a sentence explaining why.
- [ ] Texts in FR and EN; update the Guide article on the Cloud save.
