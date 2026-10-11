# Unread badge and conversation polling

Status: done - verified in the browser with two accounts; tsc, vitest, build pass
Blocked by: 03
Spec: ../spec.md

## Acceptance criteria

- [x] Navigation badge = pending requests + unread Messages.
- [x] While a Conversation is open, the 15 s poll also fetches Messages newer than the last one.
- [x] Tests with fake timers and the fake client.
