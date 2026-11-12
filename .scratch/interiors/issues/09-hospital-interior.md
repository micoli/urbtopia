# Hospital interior

Status: resolved
Blocked by: 07

- Models and Fixture defs: beds, operating table, equipment, drawn in Blender.
- nurse from Tier 1, doctor from Tier 2, surgeon from Tier 3, each a part of the Well-being its Health coverage gives.
- Done when: tests cover the three parts, the posts by Tier and the wages.

## Answer

Done. The Hospital is a Service interior of kind `hospital` (bed, vitals monitor, operating table, medicine cabinet, waiting chair, walls). Nurse from Tier 1, doctor from Tier 2 and surgeon from Tier 3 each deliver a part (`carePrimary`, `careDoctor`, `careSurgeon`) of the care its furniture makes possible; `careWellbeingOf` weighs them (`care` in `interiors.json`: 10 points, weights 0.5, 0.3, 0.2) and `computeHomeBenefits` adds the best care of the Hospitals serving a Home to its Well-being, as the Comfort of a Home interior is, within the same limit. The Fill rate is read from the Commute being worked out, so it is applied. Reach and capacity of the Hospital are unchanged.
