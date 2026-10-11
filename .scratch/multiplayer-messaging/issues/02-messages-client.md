# Messages client

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [ ] `SocialClient.sendMessage` and `listMessages`, typed errors (`message-invalid`, `not-friends`, `rate-limited`).
- [ ] Friend carries `unread` and `lastMessageAt`; snapshot parser updated; fake client mirrors the server rules.
- [ ] Database types regenerated; tests.
