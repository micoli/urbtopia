# City switcher and lifecycle

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

The in-game UI to create, switch, rename and delete Cities.

## Acceptance criteria

- [ ] Create: new Seed, chosen Difficulty, Tutorial; refused at three Cities.
- [ ] Default City name: Seed words without digits, title-cased ("Gently Amber Fox"), suffixed " 2", " 3"… on collision.
- [ ] Rename: at most 32 characters, unique among the account's Cities regardless of case, with an inline error.
- [ ] Switch: saves the open City, then opens the chosen one with Catch-up.
- [ ] Delete: asks to type the City name; impossible for the last City; refused while the City has an open Trade offer, a waiting Shipment (sent or received) or an accepted Challenge, listing what blocks; also deletes its Cloud save.
- [ ] FR/EN strings; Playwright test with `?bypass-tutorial&keep-local` covering create, switch, rename, delete.
