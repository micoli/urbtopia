# Multiplayer, delivery 3: Trade offers between Friends

Status: ready-for-agent

## Problem

Friends can talk (delivery 2) but cannot exchange anything. A player wants to send Materials or Goods to a Friend, for a price in Urbs or as a gift, without the server knowing the city (ADR 0003, 0015) and without losing or duplicating goods when the app crashes or the network drops between two steps.

## Decisions

Settled in the grilling (Q12-Q17) and recorded in [ADR 0025](../../docs/adr/0025-trade-escrow-trusts-the-client.md); polling per [ADR 0026](../../docs/adr/0026-social-features-poll-instead-of-realtime.md). Vocabulary (Trade offer, Escrow, Friend) in `CONTEXT.md`; this spec adds **Lot**.

**What can be offered**
- A Lot is up to 10 lines of one Material or Good each, quantity 1 to 9 999 per line. Crop Materials are included; Seed packs, buildings and bare Urbs are not.
- The price is a whole number of Urbs from 0 (a gift) to 10 000.
- The recipient can only accept a Lot whose items they have Unlocked, and only if the matching storage compartments have room for it (checked locally, ADR 0025).

**Lifecycle**
- The sender creates the offer: the Lot leaves their local stock and the server holds it in Escrow. The client generates the offer id; the creating RPC is idempotent on it.
- The recipient accepts: the price leaves their Urbs and the server holds it in Escrow. The recipient then claims the Lot (it enters their stock, only when the compartments have room) and, only once the Lot is claimed, the sender claims the payment (Urbs enter their balance), so a Lot can never lapse after its payment was taken. Each claim happens once.
- The recipient can refuse, the sender can cancel while the offer is open; both return the Lot to the sender, who claims it back.
- An open offer expires 72 hours after creation: the Lot returns to the sender. An accepted offer whose Lot is not claimed within 72 hours of acceptance lapses: the Lot returns to the sender and the payment to the recipient.
- Removing a Friend or a Block closes every offer between the two, returning each Escrow to its owner. Deleting cloud data deletes the player's offers and returns what they held to the other side.

**Limits**
- At most 5 open offers per sender and 30 offers created per day; the server also bounds the Lot (10 lines, quantities, price). No tax or commission.

**Safety against crashes (no loss, no duplication)**
- The local save carries a trade ledger: every operation (create, accept, claim) is written to the save before the matching RPC, and an Escrow claim is credited locally only once, keyed by offer id and claim kind. After a crash or a lost answer, the ledger is replayed against the server until it agrees (create and accept are idempotent on the offer id; a claim already made on the server answers with its content, which the ledger credits if it had not been).
- This is a change to the save format: a version bump, a migration and a frozen fixture (ADR 0003). An ADR for the ledger is written with that ticket.

**Where it lives**
- The "Exchanges" tab of the Social window lists offers received, offers sent and what is waiting to be claimed, and has the form to propose a Lot to a Friend (a Trade button on each Friend row opens it for that Friend).
- Offers are part of the social state delivered by the existing poll and its cursor; the Social badge also counts received open offers and claims waiting.
- The server never checks stocks or Urbs (ADR 0025): the only guards are the limits above and the single-claim rule.

## Out of scope

Trading Seed packs, buildings or land; bare Urbs transfers; barter (Lot for Lot); counter-offers; a public market or auction; price suggestions; taxes; offer history beyond the open and claimable ones; chat messages about an offer; anti-cheat (ADR 0025).

## Issues

1. `01-trade-schema-and-rpc` - table, RPC, lifecycle, limits, expiry job, pgTAP
2. `02-trade-client` - `SocialClient` methods, fake client, parsing, types
3. `03-trade-ledger-in-the-save` - core commands, ledger in the state, save migration, ADR
4. `04-trade-orchestration` - create, accept, refuse, cancel, claim with persist-then-call and replay
5. `05-exchanges-tab` - offer form, lists, claims, errors
6. `06-trade-badge-and-polling` - offers in the social state, badge count, replay on poll
