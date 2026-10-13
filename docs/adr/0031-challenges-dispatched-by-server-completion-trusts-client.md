# Challenges are dispatched by the server and their completion trusts the client

Accepted. Extends [ADR 0015](0015-supabase-cloud-save-mirror-with-rpc-only-writes.md), [ADR 0025](0025-trade-escrow-trusts-the-client.md), [ADR 0026](0026-social-features-poll-instead-of-realtime.md) and [ADR 0028](0028-trade-ledger-in-the-save-for-exactly-once-effects.md), which stay valid.

A Challenge is a list of Materials and Goods to deliver to a Challenge stock before a deadline. The server publishes Challenges: a cron job creates the Daily challenges (three variants per day, each with a Citizens threshold so that every item is unlocked for the player who sees it), and Events are inserted by hand with a start and an end. The client reads them by polling, like the other social features, and shows only the variants whose items are all unlocked in its city.

Acceptance is online-only and stamped with the server clock, at most one accepted Challenge per Player account at a time. The Challenge stock lives in the local save: setting units aside debits the Storehouse and is irreversible. When the stock is complete the client declares it through an idempotent RPC (`urb_`-prefixed, RPC-only writes) that checks only the deadline against the server clock, that the acceptance exists and that it is claimed once. The Urbs reward (twice the Market value of the goal) is credited to the save through the ledger of ADR 0028; a Medal is stored server-side and shown in the Social window.

Time skip is refused in the client while a Challenge is accepted and unfinished. Catch-up still runs.

## Why

- The server never knows the city (ADR 0003, 0015), so it cannot verify stocks, exactly as for Trade offers (ADR 0025).
- A server clock is the only deadline a player cannot move; the game clock can be advanced by Time skip, which is why Time skip is locked.
- Units are consumed on delivery rather than staked in Urbs: the player risks something real without a second currency flow, and a failed Challenge loses only what was set aside.

## Consequences

- Not anti-cheat: a modified client can claim any Challenge without the stock. Challenges and Medals must not feed a leaderboard without revisiting this decision.
- The Time skip lock is a client rule only; a modified client bypasses it.
- A completion declared offline waits for the network and can miss the deadline; this is accepted.
- Adding or changing a Challenge column is a migration validated in CI against a local Supabase.
- Items can come from any source (production, purchase, Trade offer) since only the set-aside units count.
