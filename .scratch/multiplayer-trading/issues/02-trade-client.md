# Trade client

Status: done - tsc, vitest and build pass; server JSON checked against the parser
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [x] `SocialClient` methods for every trade RPC with typed errors (limit reached, not friends, invalid lot, offer unavailable).
- [x] Offers in the snapshot (received, sent, claimable) with parsing; fake client mirrors the server rules including expiry.
- [x] Database types regenerated; tests.
