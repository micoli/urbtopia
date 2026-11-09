# State, commands and save of a Factory floor

Status: resolved
Blocked by: 01

Add the floor to a Factory building (Fixtures), the Place, Move (and turn) and Remove commands, and the save validation.

## Answer

- `Building.floor?: FloorData` (Fixtures and next id). Optional, so no save version bump: an old Factory loads with no floor, which is an empty one. The migration contract test is unchanged.
- Commands `PlaceFloorFixture`, `MoveFloorFixture`, `RemoveFloorFixture` in `src/core/factory/floorCommands.ts`: the building must be a Factory, the Fixture of the factory kind and allowed by the Tier (`minTier`), inside the grid of the Tier and off the entrance cell, paid in Urbs; moving is free; removing refunds the Venue refund ratio.
- `src/persistence/validate.ts` checks the floor (a Factory only, Fixtures of the factory kind, ids below the next id), shared with the Venue Fixture check.
- Catch-up has nothing to replay yet: the floor changes only through commands. Wear and breakdowns come with issue 05, which adds the time-dependent part.
- Repair and the Technician are left to issue 05.
