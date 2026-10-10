# Venues and Fixtures

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

Venue kind with `venueType` (arcade, supermarket, hotel): per Tier grid size, Staff posts, upgrade cost, power (`VENUE_PROFILES`), Rank thresholds, shell models and corner placement (`VENUE_SHELL_MODELS`, `VENUE_CORNER_PLACEMENT`), Staff and Visitor silhouettes. `FIXTURES` (`src/core/venues/fixtures.ts`) to one file per Fixture, schema discriminated by Venue type (shelf, checkout, bed…), `minTier`, `minRank`. Fixture categories per Venue type in the Venue file. Editor shows Fixtures under their Venue.

## Comments

Delivered (2026-10-10):

- Arcade, Supermarket and Hotel are a `venue` kind: Rank thresholds, Staff roles, front role, Fixture categories, interior shell (floor, wall, corner models and corner placement) and Staff models at the root; Tiers with grid size, Takings cap, power, event budget and multiplier, and Staff posts by role. `VenueType` is generated; the building id is the Venue type, its rules stay in code.
- Fixtures are a collection (`assets/defs/fixtures`, 45 files) whose schema depends on the Venue (plays per hour, shelves and checkouts, beds, baths and comfort); `FixtureId` and the per-Venue unions are generated, names moved from `src/i18n/venues.ts` into the files.
- `gridSizeOf`, `takingsCapOf`, `postsOf`, `minTierOfRole`, `eventBudgetOf`, `eventMultiplierOf` and `venuePower` now take the Venue type and read its Tiers; the scene reads shells and Staff models from the files (`MINI_CHARACTER_FILES` moved to `miniCharacters.ts` so node scripts can still import it).
- Editor: Fixtures grouped by Venue, the schema branch chosen from the required constants (kind and Venue), Venue defaults, Staff roles offered as keys of the posts record. Visitor silhouettes stay for issue 15.
