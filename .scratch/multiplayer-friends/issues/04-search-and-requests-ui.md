# Search and requests UI

Status: done - tsc, vitest and build pass
Blocked by: 03
Spec: ../spec.md

## What to build

In the Friends tab: search by exact email, send a Friend request, handle incoming and outgoing requests, list and remove Friends, Block and unblock.

## Acceptance criteria

- [x] Search shows the same neutral confirmation whatever the outcome; rate-limit error shows the remaining delay.
- [x] Incoming requests can be accepted or refused; outgoing ones cancelled.
- [x] Friends list shows Handles only, never emails; remove with confirmation.
- [x] Blocked list with unblock.
- [x] Cap errors (50 Friends, 20 pending) shown clearly.
- [x] FR/EN strings, one component per file, component tests with the fake client.
