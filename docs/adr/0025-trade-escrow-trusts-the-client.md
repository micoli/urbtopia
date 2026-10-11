# Trade offers use a server escrow that trusts the client's stocks

Accepted. Extends [ADR 0003](0003-localstorage-versioned-save-envelope.md) and [ADR 0015](0015-supabase-cloud-save-mirror-with-rpc-only-writes.md), which stay valid: the local save remains the source of truth, the server never knows the city.

A Trade offer moves a lot of Materials and Goods, and a price in Urbs, between two Friends. The sender debits the lot from the local save, then the server holds it in an Escrow. The recipient accepts after checking locally that the Urbs and the storage room are there, debits the price locally, and the server holds that payment in turn. Each side then claims what is owed to it. Postgres functions (`urb_`-prefixed, RPC-only writes, as in ADR 0015) enforce the rules: one claim per Escrow, return to the owner on refusal, expiry after 72 hours or Block, at most 5 open offers per sender, 10 000 Urbs per offer and 30 offers created per day.

The server does not check that the lot existed in the sender's city, nor that the Urbs existed in the recipient's. Multiplayer is between Friends only, with no ranking and no shared economy, so a modified client can only cheat people who accepted it as a Friend.

## Why

- Stocks live in the local save and in the Cloud save envelope, stored as-is and validated only by the client (ADR 0015). Checking them server-side would mean parsing a possibly stale mirror, and still would not prove anything.
- Making the server authoritative over inventories would contradict ADR 0003 and break offline play.
- An Escrow with single-claim and expiry gives the guarantees the server can actually keep: no duplication through a double claim, nothing lost on refusal or expiry.
- A volume cap bounds the damage of a cheating client without any stock verification.

## Consequences

- Multiplayer is explicitly not anti-cheat: it must not feed a leaderboard or a public market without revisiting this decision.
- A lost local debit (crash between the debit and the server call) can lose or duplicate a lot; each step goes through the same persist-then-call order as pushes in ADR 0015, and the Escrow is created by an idempotent RPC keyed by a client-generated offer id.
- Changing the offer schema is a migration validated in CI against a local Supabase.
