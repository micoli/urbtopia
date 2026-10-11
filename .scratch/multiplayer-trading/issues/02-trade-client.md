# Trade client

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## Acceptance criteria

- [ ] `SocialClient` methods for every trade RPC with typed errors (limit reached, not friends, invalid lot, offer unavailable).
- [ ] Offers in the snapshot (received, sent, claimable) with parsing; fake client mirrors the server rules including expiry.
- [ ] Database types regenerated; tests.
