# 01 Library facility that does not count as Education

Status: resolved
Blocked by: none

Use the `add-building` skill. Red first, in `services.test.ts` / `buildingIndex.test.ts` style:
- a Library in reach, with capacity left, covers a Home (`isServiceCovered` true) and obeys capacity and Transit reach like any facility;
- `coveredCategories` of that Home does NOT contain `education` from a Library alone; a School still gives it;
- `missingServices` at Tier 3 still reports `school` with only a Library;
- `coveredServiceUnits` is unchanged by a Library;
- footprint 2x2 / 3x2 / 4x2 by Tier; capacity and radius per Tier match the spec.

Seam to design: how a facility says "I am a school degree" (suggest a def field, e.g. `degree`, read by `facilitiesOfCategory`-style helpers) so `categoryCoverageRatio`, the Education Need factor and service units use degrees, not the whole category. Provisional model reuses the School's. Regenerate `buildingTypes.generated.ts`.

## Answer

Done, see the commit of this ticket in the history (`git log --grep` on its title).
