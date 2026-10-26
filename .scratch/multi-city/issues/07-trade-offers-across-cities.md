# Trade offers across Cities

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

Trade offer effects routed to the right City when an account has several.

## Acceptance criteria

- [ ] A Trade offer is sent from the open City and records it.
- [ ] Accepting puts the Lot into the City open at acceptance time, after the usual room and Urbs checks.
- [ ] Payment received, and a Lot or price returned on refusal or expiry, go back to the City the effect left, claimed when that City is next opened.
- [ ] Ledger replay stays exactly-once per City; tested with the fake trade book across two Cities.
