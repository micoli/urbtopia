---
status: accepted
---

# The Interior profile is the one seam of the Interior family

Refines [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md): its three families on one engine were never given one place in the code. The family of a building was decided again in `interiorSizeOf`, `interiorBonusOfBuilding`, `interiorEconomyRows`, the save validation and both interior canvases, by predicates (`hasProductionInterior`, `hasServiceInterior`, `hasLineInterior`, `type === 'packhouse'`) with about 48 calls in 16 files, and from two sources of truth.

## Decisions

- **One lookup.** `interiorProfileOf(buildingType)` returns a read-only Interior profile, or nothing for a building with no interior. It holds the static facts by Tier: Interior family, grid size, build menu sections, Staff roles, caps, unlock threshold, bonus model. Calculations that read the game state (bonus, whether a Fixture can stand, the economy) stay in their modules and dispatch on the profile, never on `building.type`.
- **Three Interior families.** `production`, `service` and `home`. The Home interior is the `home` family with a reduced profile (size, sections; no roles, no bonus), no longer the implicit "otherwise" of a ternary. Every type of building of the kind `home` shares it, so it is resolved by kind and takes its sizes from `homeInterior.json`, not from `interiors.json`. A Venue is outside the module.
- **Factory and Packhouse are declared in data.** They join `assets/defs/balance/interiors.json`. Their bonus formulas stay in code, chosen by a declared bonus model (`factory`, `line`, `assigned`, `packhouse`).
- **One source for the family.** `interiors.json` is the only source of the Interior family of a building. `PRODUCTION_INTERIOR_KINDS` and `SERVICE_INTERIOR_KINDS` are derived from it, and a test keeps them in line with the `venue` of the generated Fixtures.
- **A leaf module in `core/interiors`.** The profile imports nothing from `core/factory`. `core/factory` and `interiorEconomy` depend on it, never the reverse.
- **The predicates stay as the reading vocabulary of the profile.** `hasProductionInterior`, `hasServiceInterior`, `hasLineInterior`, `isInteriorBuilding`, `interiorKindOf` and `interiorSizeOf` are one-line derivations of the profile, so the decision lives in one place. Their ~48 calls stay: a call that asks `hasServiceInterior(building)` reads better than a repeated test of the profile's family, and replacing them would spread the shape of the profile over 16 files. A new question about the family becomes a profile field first, then a predicate if it is asked in several places.
- **One test through the interface.** A table-driven test over every declared type checks: a size for every Tier, a family consistent with the generated Fixtures, no building with an interior and no profile, non-empty build menu sections. The per-building tests stay.

## Why

The family is one decision with many readers. Asking it in one module gives locality (a new family or building touches the profile and the data) and leverage (one interface for every caller). Deleting the predicates would only spread their logic over the callers again, so a seam is the right shape.

## Considered options

- **Keep the predicates and add a helper per question.** Rejected: the family stays decided in many places and two sources of truth.
- **A flag per building.** Rejected already by [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md): the buildings of a family share their code.
- **Include the Venues in the module.** Rejected: a Venue has Takings, Visitors, Rank and events and its own Fixtures.

## Consequences

- `CONTEXT.md` gains Interior family and Interior profile.
- The save does not change: it holds `building.type` and `interior`, never the profile.
- The layout flags of an interior (`assignments`, `autoWork`, `line`, `yieldFromExits`…) stay as they are; reshaping them into capabilities is a later step.
