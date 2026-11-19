# Save version

Status: resolved
Blocked by: 03
Spec: ../spec.md

## What to build

The save of the games of each Planning office, with a version bump and a migration.

## Acceptance criteria

- [ ] Per office: the game number, the Hexes placed in the game under way (position and rotation), the best score and the layout of the best score.
- [ ] Never the bonus, the Deck or the Rank in the save.
- [ ] The save version goes up; a save of the previous version loads with no office entry and no loss.
- [ ] A Tier raised in the middle of a game keeps the Deck of that game; the next game uses the new size.
- [ ] Demolishing an office drops its entry.
- [ ] Round-trip tests of the save and a migration test from the previous version.
