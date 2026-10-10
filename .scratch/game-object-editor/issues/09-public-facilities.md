# Public facilities

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

`FACILITIES` (radius, power, water, Service category, model) and `FACILITY_TIER_CAPACITY` unfolded into explicit capacities per facility and Tier; drop `MAX_FACILITY_TIER`. Service vehicle model per facility moves here or to issue 13. Descriptions keep `src/i18n/facilities.ts` until issue 16.

## Comments

Delivered (2026-10-09):

- Public facilities are a `facility` kind: Service category, radius (absent: the whole city), power, water and `unique` at the root; Tiers with an explicit Citizen capacity (absent: unlimited), model, footprint and upgrade cost, unfolded from the former multipliers and cost factors. `FacilityType` is generated; `SERVICE_CATEGORIES` lives in `serviceCategories.ts`.
- `FACILITIES` and `facilityCapacity` read the files; `FACILITY_TIER_CAPACITY`, `MAX_FACILITY_TIER` and `facilityUpgradeCosts` are gone (the coverage sentence uses `maxTierOf`).
- Service vehicle models stay for issue 13 and the descriptions for issue 16.
