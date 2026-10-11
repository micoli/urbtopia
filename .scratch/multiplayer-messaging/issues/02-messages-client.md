# Messages client

Status: done - verified: pgTAP, db lint, tsc, vitest
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [x] `SocialClient.sendMessage` and `listMessages`, typed errors (`message-invalid`, `not-friends`, `rate-limited`).
- [x] Friend carries `unread` and `lastMessageAt`; snapshot parser updated; fake client mirrors the server rules.
- [x] Database types regenerated; tests.
