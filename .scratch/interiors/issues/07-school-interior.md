# School interior

Status: resolved
Blocked by: 01

- Models and Fixture defs: desks, blackboard, lockers, drawn in Blender; no Condition, no Technician.
- teacher carries the share of Schooling this School gives to the Knowledge of the Homes it covers; reach and capacity unchanged.
- Wages: ADR 0072; a facility with no interior or no Staff costs nothing.
- Done when: Knowledge changes only with the teacher filled, and tests cover the part and the wages.

## Answer

Done, with the shared engine of the Service interiors. A Service interior has no Links and no Condition: each piece of furniture adds `quality` (`schoolDesk`, `schoolTeacherDesk`, `schoolLockers`, `schoolGlobe`, `schoolBlackboard`, which hangs on the back wall like a painting), summed and saturating towards the cap of the Tier (`service.qualityCaps` in `interiors.json`), and the teacher delivers it in proportion to the Staff hired (`serviceQualityOf`). `homeKnowledge` multiplies the share of Schooling of a School by `1 + quality` for the Homes that School serves (`servingFacilitiesOf` now tells which facilities serve each Home); reach and capacity are unchanged. The interior opens once the city has `unlockCitizens` Citizens (now also checked for the Production interiors) behind the `serviceInterior` flag, from the School panel. The Fill rate is not applied to what feeds Knowledge, which the Commute reads (ADR 0071). The Library and the Hospital models, registered for their shells, stay reserved.
