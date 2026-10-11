# Search and requests UI

Status: ready-for-agent
Blocked by: 03
Spec: ../spec.md

## What to build

In the Friends tab: search by exact email, send a Friend request, handle incoming and outgoing requests, list and remove Friends, Block and unblock.

## Acceptance criteria

- [ ] Search shows the same neutral confirmation whatever the outcome; rate-limit error shows the remaining delay.
- [ ] Incoming requests can be accepted or refused; outgoing ones cancelled.
- [ ] Friends list shows Handles only, never emails; remove with confirmation.
- [ ] Blocked list with unblock.
- [ ] Cap errors (50 Friends, 20 pending) shown clearly.
- [ ] FR/EN strings, one component per file, component tests with the fake client.
