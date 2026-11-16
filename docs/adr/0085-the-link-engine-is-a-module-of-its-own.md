---
status: accepted
---

# The Link engine is a module of its own, and the bonus, the Line and the recycling read its report

Refines [ADR 0068](0068-packhouse-floor-reuses-the-factory-floor-engine-with-a-line-network.md), [ADR 0074](0074-mill-staff-is-assigned-to-a-millstone-and-the-pipes-carry-the-grain.md) and [ADR 0076](0076-recycling-interior-moves-capacity-and-collection-distance.md), which have every Production interior reuse the engine of the Factory interior. That engine lives in `core/factory/factoryInterior.ts`, 1111 lines that hold five concepts: the Links (Drive, Flow and the reach of a Line, up to line 600), the bonus formulas (the Factory, the Line, the Packhouse, the assigned Staff, and their dispatch), the paths and faults of a Line, the gains of a Recycling plant, and the upstream graph that tells what a Display counter can sell. The seam between them only exists in the names of eleven per-building test files, and about 36 files import the whole module.

## Decisions

- **A module per concept, in four steps, each of which can be committed.** First the Link engine (`core/factory/interiorLinks.ts`, which also holds `interiorFixturesOf`, the entry of the engine), then the bonus (`interiorBonus.ts`), then the paths of the Line with the upstream graph (`interiorLine.ts`), then the recycling gains (`recyclingGains.ts`). The work may stop after any step. It was done in the four steps, and `factoryInterior.ts` is gone.
- **The interface of the Link engine is its report.** `interiorReportOf(fixtures)` and the type `InteriorReport` (`fixtures`, `at`, `drive`, `powered`, `flow`, `line`, `links`), plus the views the engine already owns: `interiorLinksOf`, `interiorMotionOf`, `interiorUsageOf`, `interiorUsageWeightsOf`, `interiorOverloadedOf` and `interiorMotorLoadOf`. `DriveReceipts`, `FlowReach` and `LineReach` stay exported as parts of the report. The bonus, the Line and the recycling read what they need from it (outside the engine, the report is read for `links` seven times, `fixtures` six, `drive` three, `line` three and `at` once). An accessor per field would make modules with no depth.
- **The cache is keyed by the layout.** `memoized` moves to `memoizedByLayout.ts` and is renamed `memoizedByLayout`: it serves twelve places, and the name states the key, the layout of the Fixtures (what, where, turned how, broken or not), never their Condition.
- **No barrel.** `factoryInterior.ts` disappears at the end. Each name goes to the module that owns it, and the importers are updated by script at each step. A file that re-exported everything would only forward, and `core/index.ts` already is the public surface.
- **Files stay where they are.** The new modules sit in `core/factory/` beside the existing ones; no folder moves, as in [ADR 0083](0083-interior-commands-edit-through-one-module.md).
- **Moves, not behaviour.** Each step changes no behaviour, so it has no red test. The eleven per-building test files and the full suite are the guard, and only their imports change. A step that exposed a new behaviour would get its test first.

## Why

The Link engine depends on a list of Fixtures and on the declared layouts, never on a building, a Tier or a bonus, so it is the one block that can be read, and tested, without the rest. The three modules that read its report each get a size that fits in a head (locality), and the engine is reused by every family through one interface (leverage). Deleting the split would put the five concepts back in one file, where a change to the bonus is hard to tell from a change to the Links.

## Considered options

- **Split only the bonus out of the file.** Rejected: the report would stay inside a 600-line file that the bonus still reads through its private function.
- **Keep `factoryInterior.ts` as a barrel.** Rejected, as above.
- **One module per building.** Rejected: the families share the engine on purpose, and per-building files would copy it.

## Consequences

- The imports of about 36 files and of the per-building tests change, with no change in what they test.
- `core/index.ts` keeps exporting the same names, from their new modules.
