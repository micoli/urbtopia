# The Hall of fame trusts the client's Citizens count, bounded by a growth cap

Accepted. Amends [ADR 0025](0025-trade-escrow-trusts-the-client.md), whose "no leaderboard" consequence no longer holds. ADRs [0003](0003-localstorage-versioned-save-envelope.md) and [0015](0015-supabase-cloud-save-mirror-with-rpc-only-writes.md) stay valid: the local save remains the source of truth and the server never simulates the city.

The Hall of fame ranks the ten biggest cities by Citizens. Each push of the city also replaces a Showcase (the city minus its trade ledger) in a `urb_showcase` table readable by every authenticated user, anonymous ones included, and stores the Citizens count declared by the client next to it. Writes go only through `urb_`-prefixed RPC functions. The RPC refuses a ranking value that grows faster than a cap per hour of server time (20 % and at least 500 Citizens): the Showcase is still replaced, the ranking keeps its previous value. The top ten is read on demand, one row per account, ties broken by seniority.

Players are in the Hall of fame by default once they have a Handle and may opt out; opting out deletes the Showcase at once. A Visit loads the Showcase into a throwaway in-memory state; an older format is migrated in memory only and nothing is written back to `urb_saves` or the Showcase.

## Why

- Recomputing Citizens server-side means porting the simulation to SQL, or running it in an Edge Function: far out of proportion for a cosmetic ranking, and the stored envelope is client-validated only (ADR 0015).
- A growth cap makes the cheap cheats (editing a number) visible and slow, without any anti-cheat machinery.
- A separate Showcase keeps the Cloud save private and independent of its version history.

## Consequences

- The ranking is not tamper-proof: a modified client can climb slowly. Nothing of value is attached to a rank. Giving one a reward would require revisiting this decision.
- Every push now writes two rows; the Showcase counts against the same 1 MB cap.
- Blocks hide a Showcase between the two accounts.
- Changing the `urb_showcase` schema is a migration validated in CI against a local Supabase.
