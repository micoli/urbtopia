---
status: accepted
---

# The scene is fed by one Scene plan

Refines [ADR 0080](0080-guided-demonstrations-replay-semantic-scripts-in-an-isolated-interior.md). `VenueCanvas` (the game) and `DemonstrationCanvas` (the demonstrations) each decided what to push into `VenueScene` from a building, through ten setters (`setSize`, `setLightLevel`, `setFloorModel`, `setFixtures`, `setAvatars`, `setMotion`, `setLine`, `setTrucks`, `setBroken`, `setWear`), and the two had already diverged: a demonstration showed no trucks at the Exits of a Packhouse or a Recycling plant, no parquet and no dimmed light, and did not honour the breaker.

## Decisions

- **One derivation.** `scenePlanOf(building)` is a pure function in `src/scene/scenePlan.ts`, with no import of `three`. It reads the core (Interior profile, bonus, Line, Staff avatars, breakdowns) and returns a `ScenePlan` in the vocabulary of the scene: size, light level, floor model, Fixtures, trucks, Line paths and pace, motion and pace, avatars, broken tiles, and wear (read as what is left in a Production interior, as what is lost elsewhere). It serves an interior and a Venue; a Venue only uses the base of it (Fixtures, size, light).
- **One method on the scene.** `VenueScene.setPlan(plan)` replaces the ten setters, which become private. Each part keeps its own check against rebuilding (a signature or a reference), inside the scene.
- **Left out of the plan.** What the player does and what a Venue simulates: the ghost, the selection, the warnings and the crowd of a Venue. They stay with `VenueCanvas`. The pause of the animation and the camera stay with `DemonstrationCanvas`.
- **Stable references.** The plan relies on the memoised derivations (`linePathsOf`, `interiorMotionOf`, `linkedExitsOf`) and on module constants for the empty cases, so that two plans of the same building share their references and the scene does not rebuild on every tick of the store. A test checks it.
- **One test surface.** `scenePlanOf` is tested through its returned value, without WebGL, one case per scenario: a Packhouse with its breaker off, a running Bakery, a School, a Recycling plant, a Home, a Venue. There is no test of `VenueScene` itself.
- **The demonstrations show what the game shows.** They gain the trucks, the parquet and the light, with the same breaker rule. This is the only visible change.
- **The name.** "Scene plan", not "Room plan": **Room** is already a glossary term (a Hotel bed with its bathroom). It is a technical term and is not added to `CONTEXT.md`.

## Why

The plan is what the scene shows, and it is derived from the state of a building. Deriving it in one module gives locality (a divergence between the game and a demonstration can no longer happen) and a test surface that needs no WebGL, where the bugs were hiding in how pure functions were called by two canvases.

## Considered options

- **Keep the setters and share a helper that calls them.** Rejected: the interface of the scene stays ten setters with an implicit order.
- **Put the derivation in `core/`.** Rejected: the core knows no light level and no wear bar; the scene already reads the core.
- **Merge the two canvases.** Rejected: the editing of `VenueCanvas` and the script of `DemonstrationCanvas` have nothing in common.

## Consequences

- The only callers of the ten setters are the two canvases, so they migrate together once the plan is complete and tested.
- `VenueScene` still imports domain functions to draw (`conditionOf`, `focusOf`, `workFocusOf`, `isProducerRole`); moving them behind the plan is a later step.
