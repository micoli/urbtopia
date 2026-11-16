---
status: accepted
---

# The Interior profile answers the numbers and the bonus model, and the layout parameters stay data

Extends [ADR 0081](0081-interior-profile-is-the-one-seam-of-the-interior-family.md), which left the layout flags of an interior as they were. Once the profile existed, three kinds of friction remained. The "pick the value of the Tier, or the last one" idiom was copied eight times (`homeInterior`, `interiorLimits`, twice in `serviceInterior`, `interiorStaff`, `interiorProfile`, and `tierValue` next to an identical `capOf` in `factoryInterior`). The fallback "the layout of the type, otherwise the balance of the Factory" was redone in `interiorCapsOfType`, `interiorGridSizeOfType`, `bonusOf` and `technicianPostsTable`. And the model that computes the bonus of a building was hidden in the combination of two flags: `interiorBonusOfBuilding` chose `assignedBonusOf` for `assignments`, `lineBonusOf` for `line`, and the machines otherwise.

## Decisions

- **One helper for the Tier.** `valueByTier(values, tier)` in `core/interiors/valueByTier.ts`, a leaf: the value of the Tier, the last one when the Tier goes beyond the list, 0 for an empty list. It replaces the eight copies.
- **The profile answers the numbers.** `interiorProfileOf` also gives `caps(tier)` (speed and yield, and sales and capacity when the type has them) and `technicianPosts(tier)`, for every type, the Factory and the Packhouse included, which read their own balance files as they do for the size of the grid. The callers stop falling back from the layout to the balance of the Factory: they ask the profile.
- **The bonus model is declared by every Production interior.** `bonusModel` takes five values in `interiors.json`: `factory`, `packhouse`, `machines` (Mill, Textile mill), `line` (Workshop, Recycling plant, Dairy, Storehouse, Livestock farm) and `assigned` (Bakery, Knitwear factory). `interiorBonusOfBuilding` chooses the calculation from it. The flags `line` and `assignments` leave the schema and the data: a Line is deduced from the model (`line`, `assigned`, `packhouse`), and `hasAssignments` becomes "the model is `assigned`, or the Staff work on their own (`autoWork`)".
- **The other layout parameters stay data.** `autoWork`, `yieldFromExits`, `laneSlowdown`, `requires`, `milling`, `recycling`, `yieldGroups`, `feeds`, `extraProducers`, `salesCaps` and `capacityCaps` each have one to three readers. An object of capabilities that replaced them would only rename them; deleting it would bring back the same fields. It is rejected, so that a later review does not propose it again.
- **Three vertical steps, tests first.** `valueByTier` and its table test, then the eight copies one file at a time. Then the caps and the posts in the profile, with a table test over every declared type whose expected values are literals taken from the code before the change. Then the bonus model: a table test that fixes the model of each type, the dispatch, and the removal of the two flags. The existing tests of each interior stay as they are.

## Why

The numbers by Tier and the choice of the calculation are questions about the kind of interior, which the profile already answers for the family and the size. Asking it keeps the rule in one place (locality) and lets a new type declare a model instead of combining flags (leverage). The remaining parameters are data that each has few readers, so they do not earn a module of their own.

## Considered options

- **A capability object per type.** Rejected, as above.
- **Keep both flags next to the model.** Rejected: `line` and `assignments` would be a second source for what the model says.
- **Leave the clamp copies as they are.** Rejected: two identical functions in one file show the fault is real.

## Consequences

- `interiors.json` and its schema lose `line` and `assignments` and gain `bonusModel` on every Production interior; the generated schema is rewritten.
- The saves are not touched: they hold the type and the interior, never the profile.
