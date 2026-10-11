# A trade ledger in the save makes every trade effect happen exactly once

Accepted. Completes [ADR 0025](0025-trade-escrow-trusts-the-client.md): the Escrow lives on the server, the ledger keeps the local side honest.

A Trade offer touches the local stock or Urbs in six ways: reserve the Lot, pay the price, receive the Lot, receive the payment, get the Lot back, get the price back. Each is a core command (`TradeApply`) that changes the state and writes a ledger entry `(offerId, effect)` in the same step, so a second `TradeApply` with the same pair changes nothing. An entry carries what an RPC replay needs (the Lot, the price, the other player) and a `confirmed` flag that turns true, through `TradeConfirm`, once the server acknowledged the matching call. `TradeRollback` gives back exactly what an unconfirmed reserve or payment took when the server refused for good. The ledger is part of `GameState` (save version 14, `tradeLedger`), entries older than 30 days are dropped, and the three commands are always allowed, including during the Tutorial.

The orchestration, in a later ticket, is persist-then-call: apply the effect, let the save be written, call the RPC, confirm. After a crash or a lost answer, unconfirmed entries are replayed against the idempotent RPC; a claim whose answer was lost is applied again with the same key and changes nothing if it already happened.

## Why

- A local debit followed by a network call can be interrupted between the two: without a record, a Lot is lost (debit done, offer never created) or credited twice (claim answered twice). A keyed ledger turns both into replays.
- The key is the pair (offer id, effect) chosen by the client, so no server round trip is needed to decide whether a local effect already happened.
- Putting the ledger in the state, not beside it, makes the effect and its record one atomic change through the existing save, undo-free path (ADR 0003), and keeps `src/core` pure and replayable.

## Consequences

- Every state change needs a version bump and a migration (ADR 0003): done here, with a frozen version-14 fixture.
- A receiving effect that cannot apply (no room) leaves no entry, so it can be retried later; the server keeps the Escrow meanwhile.
- The ledger grows by a few entries per trade and is bounded by the 30-day retention.
- Nothing here makes cheating impossible (ADR 0025): a modified client can still invent a Lot it reserves.
