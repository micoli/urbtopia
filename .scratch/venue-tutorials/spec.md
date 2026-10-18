# Venue tutorials: learn to run a Venue

## Problem

A Venue is a rich simulation (Fixtures, Staff, Takings, Tiers) and nothing explains how to make one earn. The initial Tutorial stops long before a Venue unlocks, and the only per-feature guidance is three dismissible first-use hints.

## Decisions

- One Venue tutorial per Venue type, Arcade first, Supermarket second. The Hotel is out of scope.
- State: `GameState.venueTutorials: Partial<Record<VenueType, VenueTutorialStep | null>>`. An absent entry means not started, `null` means finished or skipped. It lives in the city save and needs a save migration: Venues already placed get `null`, saves without a Venue get no entry.
- One entry per type: only the first Arcade or Supermarket placed is guided, later ones are ignored.
- Starts automatically when the first Venue of a type is placed. It does not start at Unlock.
- A step is valid when a pure function of `GameState` says so, like the initial Tutorial. The Venue tutorial listens to no command and advances after every command and tick (`progressTutorial` loop), so it survives reload, import and Catch-up.
- No lock: every command stays allowed, no forced highlight, no Time skip.
- Independent from the initial Tutorial. While the initial Tutorial is active, its banner wins and a Venue tutorial does not start.
- `VenueData.collected?: number` (cumulative Urbs collected) is added, incremented by `collectTakings`. `earned` counts at accrual so it cannot detect a collection.
- Skip: a Skip button with `InlineConfirm` ends the Venue tutorial (`null`). Replay: a button in the Venue panel resets the entry and re-enters at the first step not yet done. It is hidden when every step is already done.
- `?bypass-tutorial` also disables Venue tutorials (no entry is created). A loaded save keeps its own state.
- UI: `TutorialBanner` is reused and parameterised (title, counter "n/N", text with chip tokens, Skip). Texts in `en` and `fr`.
- Steps stay at Tier 1: the manager post (needed for pricing) only exists from Tier 2, so pricing and Tier upgrades stay out of the tutorials. The upgrade section already covers them.

## Steps

Arcade (4):
1. Place an Arcade (road access required).
2. Open the Management view and place a Fixture (`venue.fixtures` not empty).
3. Hire an employee (`venue.staff.employee > 0`).
4. Collect Takings (`venue.collected > 0`).

Supermarket (6, steps 2 and 3 in any order):
1. Place a Supermarket.
2. Place a checkout.
3. Place a shelf (`FIXTURES[type].shelf !== undefined`).
4. Stock a shelf from the Storehouse (`fixture.stock > 0`). The text names the Storehouse and tells the player to produce Goods first. No starting Goods are given.
5. Hire a cashier.
6. Collect Takings.

## Glossary

`Venue tutorial` is added to `CONTEXT.md`, distinct from `Tutorial`.

## Testing

Pure core logic is covered by Vitest: step validation per Venue type, start on first placement only, migration of existing saves, `collected` accounting, skip and replay. The banner has a Storybook story. Highlight and flow are checked by eye in the browser.
