# Every building is defined in assets/buildings.json, edited by tools/assets-editor

Superseded by [ADR 0021](0021-game-objects-one-file-each-validated-by-generated-json-schemas.md) and [ADR 0023](0023-tier-values-and-balancing-as-data-formulas-in-code.md). Supersedes [ADR 0013](0013-simple-buildings-defined-in-models-json.md), which attached a `building` block to the model entry for sport venues and nature elements only. A building is not a model: Homes, Factories and Casinos use one model per Tier, and a model may serve several buildings or none.

`assets/buildings.json` holds one entry per building, keyed by its id (the `BuildingType`), in menu order:

- Common fields: `section` (a build menu section), `model` (the model key, the Tier 1 model for buildings that grow), `footprint`, `cost`, `unlockCitizens`, `requiresRoad`, optional `accessModes` (see ADR 0017), optional `initialSlots`, `name` (en, fr) and optional `description` (en, fr).
- `sport`: `radius` and `wellbeingBonus`, for venues whose only effect is a Well-being radius.
- `nature`: the `family`. Footprint, cost, unlock, section and benefits then come from `NATURE_FAMILIES`, so such an entry has none of the common fields except `model` and `name`.

Everything that was scattered across `BUILDING_SPECS`, `ECOLOGY_UNLOCKS`, `MODEL_BY_BUILDING`, `BUILDING_SECTIONS`, the facility, casino, sport and nature tables and the building names and descriptions in `messages.ts` and `fr.ts` is derived from it. A description may be completed by a message module that appends numbers computed from code (public facilities, sport venues); the Casino description stays generated.

Rules stay in code, keyed by id: Tier costs, capacities, production, service radii, energy, the facility category, power and water, the Casino Tiers. The Tier 1 footprint of a Home and of a Casino exists in both places and a test checks they agree.

`BuildingId`, `SportVenueType` and `NatureType` are generated into `src/core/buildings/buildingTypes.generated.ts` whenever `writeBuildings` writes the real file, so `Record<BuildingType, …>` keeps reporting missing cases; a test fails if the committed file is stale. `scripts/buildingsFile.ts` validates and writes the file and keeps the entry order. The assets editor edits it through `/api/buildings`: each model shows the buildings that use it, with a form per building.

Not generalised: unlock toasts (`event.unlocked.<id>`) exist only for public facilities, the Casino and sport venues, and `models.json` keeps describing models only.
