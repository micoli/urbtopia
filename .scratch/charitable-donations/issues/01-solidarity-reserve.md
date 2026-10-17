# Donation command and city reserve

Status: resolved

Implement [the approved spec](../spec.md) in the core engine and save format.

## Acceptance criteria

- Donate Goods by positive integer quantity, consume stock, grant no Urbs, and record fixed base value.
- Convert value to duration at `max(200, 2 * Citizens)` per 24 hours; cap the reserve at 24 hours.
- Grant +5 Well-being to every Home while active, respecting the existing cap.
- Expire at the correct boundary during normal advancement, offline catch-up, and Time skips.
- Preserve compatibility with older saves and retain donation records for account synchronization.

## Comments

Implementation started.

Implemented in `src/core/economy/solidarity.ts`, the engine commands and advancement, Well-being, and optional save fields. Focused core tests cover stock and Urbs, full reserves, population scaling, non-hour expiry, catch-up, Time skips, save compatibility, and optional Needs satisfaction.
