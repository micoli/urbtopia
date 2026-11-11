# Mill interior

Status: resolved
Blocked by: 01

- Models and Fixture defs: motor or water wheel, shafts, gears, millstones (Machines that need Drive), drawn in Blender.
- Balance: speed cap by Tier; miller carries the speed part; technician repairs.
- Management view opened from the Mill's side panel; unlock threshold.
- Done when: a Mill with an empty interior produces as before, a linked one is faster, and tests cover Links, bonus, wear and Fill rate.

## Answer

Done. The Mill is a Production interior of kind `mill`: Fixtures `millMotor`, `millShaft`, `millGear`, `millBevel`, `millBevelTee`, `millstone` and `millWall` (the Motor, Shaft, Gear and Bevel reuse the models of the Factory), its room, caps and Technician posts in `interiors.json` (`layout`), the shell in `mill.json` (`floorShell`). `interiorBonusOf` takes the building type to read its caps; the speed bonus is multiplied by the share of the miller's part (nothing until one is hired) and `advanceProduction` slows a running entry by what the Fill rate lacks. The Mill's Management view opens behind the `productionInterior` flag, with the miller and the Technician in its Staff panel. The eight models of the Mill are registered and no longer reserved.
