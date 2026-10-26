# City switcher and lifecycle

Status: done - implemented
Blocked by: 01
Spec: ../spec.md

## What to build

The in-game UI to create, switch, rename and delete Cities.

## Acceptance criteria

- [x] Create: new Seed, chosen Difficulty, Tutorial; refused at three Cities.
- [x] Default City name: Seed words without digits, title-cased ("Gently Amber Fox"), suffixed " 2", " 3"… on collision.
- [x] Rename: at most 32 characters, unique among the account's Cities regardless of case, with an inline error.
- [x] Switch: saves the open City, then opens the chosen one with Catch-up.
- [x] Delete: asks to type the City name; impossible for the last City; refused while the City has an open Trade offer, a waiting Shipment (sent or received) or an accepted Challenge, listing what blocks; also deletes its Cloud save.
- [x] FR/EN strings; Playwright test with `?bypass-tutorial&keep-local` covering create, switch, rename, delete.
