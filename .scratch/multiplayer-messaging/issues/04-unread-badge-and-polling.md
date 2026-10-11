# Unread badge and conversation polling

Status: ready-for-agent
Blocked by: 03
Spec: ../spec.md

## Acceptance criteria

- [ ] Navigation badge = pending requests + unread Messages.
- [ ] While a Conversation is open, the 15 s poll also fetches Messages newer than the last one.
- [ ] Tests with fake timers and the fake client.
