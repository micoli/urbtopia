# Challenges: Daily challenges and Events

Status: ready-for-agent

## Problem

The player has no short-term goal beyond their own city. The server should hand out Challenges: a list of Materials and Goods to deliver before a deadline, for Urbs (Daily challenge) or a Medal (Event).

## Decisions

Settled in the grilling and recorded in [ADR 0031](../../docs/adr/0031-challenges-dispatched-by-server-completion-trusts-client.md); polling per [ADR 0026](../../docs/adr/0026-social-features-poll-instead-of-realtime.md), exactly-once effects per [ADR 0028](../../docs/adr/0028-trade-ledger-in-the-save-for-exactly-once-effects.md). Vocabulary in `CONTEXT.md`: Challenge, Daily challenge, Event, Challenge stock, Challenge name, Medal.

- One concept, two kinds. Daily: renewed every day by cron, one variant per difficulty (easy, medium, hard) and per band (Citizens threshold 0, 100, 200, 600); the client shows, for each difficulty, the highest band the city reaches, so the player sees 3 Daily challenges; goal reachable in about 45 minutes of active play. Event: start and end set by hand, paid in a Medal.
- At most one accepted Challenge per Player account. A Challenge not accepted disappears at its end without consequence.
- Acceptance: online only, needs a Player account with email and Handle, stamped with the server clock. Deadline: 24 h after acceptance for a Daily, the end date for an Event, judged by the server at declaration.
- Challenge stock: the player sets units aside from the Storehouse at any time, from any source, irreversibly. Surplus beyond a line's quantity is refused. Units are consumed whether the Challenge succeeds or fails.
- Reward: Daily pays 2x the sum of the Market values of the goal's units in Urbs, only if the stock is complete before the deadline. Event pays a Medal and consumes the stock too.
- Completion is declared by the client through an idempotent RPC; the server checks deadline, acceptance and single claim only (no anti-cheat).
- Time skip is refused while a Challenge is accepted and unfinished; Catch-up still applies.
- Challenge name: keys stored by the server (hook phrase, main item), composed by the client in FR/EN. An Event may carry a hand-written translated name; the generated name is its fallback.
- UI: same dock icon as the Market, label "Market / Events", inner tabs Market | Events, same unlock as the Market. Notification badge when a new Challenge is available. Medals shown on the Social Profile tab and on each Friend's card.

## Out of scope

Leaderboards, anti-cheat, a Challenge shared between Friends, withdrawing units from the stock.
