# Venues and Fixtures

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 05

Venue kind with `venueType` (arcade, supermarket, hotel): per Tier grid size, Staff posts, upgrade cost, power (`VENUE_PROFILES`), Rank thresholds, shell models and corner placement (`VENUE_SHELL_MODELS`, `VENUE_CORNER_PLACEMENT`), Staff and Visitor silhouettes. `FIXTURES` (`src/core/venues/fixtures.ts`) to one file per Fixture, schema discriminated by Venue type (shelf, checkout, bed…), `minTier`, `minRank`. Fixture categories per Venue type in the Venue file. Editor shows Fixtures under their Venue.
