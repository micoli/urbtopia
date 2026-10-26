# Shipments between a player's own Cities go through the server Escrow

Accepted. Reuses the Escrow of [ADR 0025](0025-trade-escrow-trusts-the-client.md) and the trade ledger of [ADR 0028](0028-trade-ledger-in-the-save-for-exactly-once-effects.md); builds on [ADR 0047](0047-cities-each-with-their-own-saves.md).

A Shipment moves a Lot from one City of a Player account to another of the same account. The sending City debits the Lot through its trade ledger, the server holds it in an Escrow, and the destination City claims it the next time it is opened online. It never expires, waits while the destination lacks Storehouse room, and can be cancelled by the sender until claimed. Caps: 10 lines per Lot, 5 waiting Shipments per sending City, 30 per account per day. No Urbs travel.

## Why

- Both Cities belong to the same player, so writing the Lot straight into the destination's local save looks simpler. But the destination may be played on another device: a local write would raise a Save conflict or be lost, and two localStorage writes are not atomic.
- The Escrow and the ledger already give exactly-once effects across a crash or a lost answer; a second mechanism would duplicate that work.
- No price: between Cities of one owner a price would only be a transfer of bare Urbs, which would let a rich City fund a new one instantly.

## Consequences

- Shipping requires being online, unlike the rest of solo play; it does not require a Handle or an email.
- Feeder Cities can inflate a ranked City; the caps here and the growth caps of ADR 0029 are the only guard.
- Escrow rows gain a destination City id; changing that schema is a migration validated in CI against a local Supabase.
