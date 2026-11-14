# Shared base: flags, roles, parts and Fill rate

Status: resolved
Blocked by: none

- Feature flags `productionInterior` and `serviceInterior`, with the commands of each gated by `flagOfCommand`.
- `StaffRole` gains miller, baker, seller, cheesemaker, creamMaker, stocker, teacher, librarian, nurse, doctor, surgeon; wages and posts by Tier in `assets/defs/balance/`.
- An interior generalised beyond the Factory, the Packhouse and the Home: a building type declares its Fixture kind, its grid by Tier, its roles and the part each role carries.
- A part counts in proportion to its role's Fill rate (ADR 0071); an unfilled part adds nothing and removes nothing.
- Save: Staff counts per role in the interior data, migration if the schema changes.
- Done when: `tsc`, lint and the tests pass, and an existing save loads unchanged.

## Answer

Done. `assets/defs/balance/interiors.json` declares, per building, its family and its roles (part and posts by Tier); `src/core/interiors/` reads it (`interiorStaff.ts`), computes the Fill rate and the share of each part (`interiorParts.ts`) and hires, releases and pays Staff (`interiorStaffCommands.ts`). Hired interior Staff are Jobs of the building (`jobsOf`). Save: `InteriorData.staff`, validated per building type, no version bump (an absent field is an empty one). Flags `productionInterior` and `serviceInterior` gate `HireInteriorStaff` and `ReleaseInteriorStaff` by the family of the building (`flagOfCommandIn`). The 76 models of the interiors are marked `.reserved` until the scene uses them. The Technician is left to the interior tickets.
