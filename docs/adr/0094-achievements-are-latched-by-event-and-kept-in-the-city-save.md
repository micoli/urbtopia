---
status: accepted
---

# Achievements are latched by event and kept in the City's save, never recomputed from state

An Achievement says "the player has used this feature at least once". Two designs were possible: derive each Achievement from the current state of the City on every change, or record it once when the event happens.

## Decision

- **An Achievement is latched.** When its trigger event happens it is written into the City's save and stays there, even if the player later demolishes what earned it. Nothing recomputes it from the state.
- **Events come through the Command gateway.** A player Command, or a simulation result (an Election held, a Citizens threshold reached), raises a trigger event after the gateway applied it. A closed set of trigger types is coded once; each Achievement is data that names one trigger and its parameters. Adding an Achievement needs no new logic unless it needs a new trigger type.
- **Read-only states earn nothing.** A Visit never acquires an Achievement. A Replan acquires none, since it only lays down again objects already placed. Tutorial placements count. A Catch-up counts simulation results and lists them in its summary.
- **The Medal of a category is a server award.** It belongs to the Player account, is keyed by the category id and recorded once, the first time any City completes the category. The client declares the completion and the server trusts it, as in [ADR 0031](0031-challenges-dispatched-by-server-completion-trusts-client.md) and [ADR 0029](0029-hall-of-fame-trusts-the-client-with-growth-caps.md). Without an account, or offline, the Medal waits for the next synchronisation.
- **Saves from before the feature are seeded once**, silently, with the Achievements the City state proves, then a single summary toast. An Achievement the state cannot prove (a past Replan) stays to do.

## Consequences

- Deriving from state would give the retroactive case for free and cannot lose an Achievement to a bug, but it would forget everything the player demolished and need a recompute on every change. Latching costs a save field and a one-off seeding.
- An Achievement impossible in a City's Difficulty is excluded from its category; a category with none possible (Politics under Cozy) is hidden and gives no Medal.
- The save format gains an `achievements` set of ids; an unknown id from a newer game is kept untouched.
