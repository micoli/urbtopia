# Shared base: flags, roles, parts and Fill rate

Status: ready-for-agent
Blocked by: none

- Feature flags `productionInterior` and `serviceInterior`, with the commands of each gated by `flagOfCommand`.
- `StaffRole` gains miller, baker, seller, cheesemaker, creamMaker, stocker, teacher, librarian, nurse, doctor, surgeon; wages and posts by Tier in `assets/defs/balance/`.
- An interior generalised beyond the Factory, the Packhouse and the Home: a building type declares its Fixture kind, its grid by Tier, its roles and the part each role carries.
- A part counts in proportion to its role's Fill rate (ADR 0071); an unfilled part adds nothing and removes nothing.
- Save: Staff counts per role in the interior data, migration if the schema changes.
- Done when: `tsc`, lint and the tests pass, and an existing save loads unchanged.
