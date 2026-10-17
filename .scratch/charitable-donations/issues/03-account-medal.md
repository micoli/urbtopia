# Account donation progress and Ville solidaire Medal

Status: resolved

Depends on: 01

## Acceptance criteria

- Persist cumulative Donation value on the Player account across cities and resets.
- Synchronize donations without counting retries twice.
- Evolve one Medal through Bronze (1,000), Silver (10,000), and Gold (100,000).
- Display the Medal and progression on the social profile and the distinction on Friends' profiles.
- Follow existing account access controls and provide the database migration and local fake-client behavior.

## Comments

Implemented a persistent local outbox, authenticated idempotent receipt RPC, account totals, one evolving Medal, social profile progression, and fake client behavior. Migration applied to local development and database types regenerated. SQL checks cover retries, account isolation, permissions, tiers and Friends' Medal visibility. Anonymous donations remain unbound until an email account signs in.
