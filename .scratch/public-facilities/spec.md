# Public facilities

Status: implemented

## Confirmed scope

- Add constructible Public facilities in five Service categories:
  - Education: school, middle school, high school, university.
  - Administration: town hall.
  - Culture: community hall, theater, concert hall.
  - Health: hospital, with ambulance Service vehicles.
  - Safety: fire station, with fire truck Service vehicles; police station, with police car Service vehicles.
- Public facilities affect Citizen Well-being. Only the School, Hospital, Town hall, Fire station and Police station gate Home Tier upgrades; Middle school, High school, University and Culture facilities are optional.

## Domain rules

- A Public facility has no operating cost and a construction cost in Urbs. It evolves through eight Tiers that raise its capacity (×1, ×1.5, ×2, ×3, ×4, ×5.5, ×7, ×9) for an Urbs-only upgrade cost; the Town hall, with unlimited capacity, does not evolve.
- Service coverage covers a square of side 2 × radius centered on the facility, with corners rounded by 3 tiles and no road requirement for coverage itself. Each facility serves Homes nearest first while its used capacity is below its Citizen capacity; the Home that crosses the limit is still served, so a single large Home can always be covered. Town hall and university cover the whole city.
- A facility needs a road in front of it, like a Home, so Service vehicles can leave by road.
- The town hall is unique. Universities can be built multiple times; each adds city-wide capacity.
- Well-being remains a single per-Home indicator:
  - +10 per covered Service category, with diminishing returns and the existing 100-point limit. Different Culture facilities stack with diminishing returns.
  - −10 per missing required service, with the total penalty capped at −40.
  - Green space benefits and coal pollution penalties remain unchanged.
- Tax multiplier becomes `1 + Well-being / 500`, which gives roughly −8% to +20%. The previous scale was `/1000`.
- Required services per Home Tier. Each service stays required for every higher Tier. Middle school, High school, University and Culture facilities are optional: they only raise Well-being:

| Home Tier | Newly required |
| ---: | --- |
| 3 | School |
| 5 | Hospital |
| 6 | Town hall, fire station, police station |

- A Home can upgrade to a Tier only when every service required by that Tier covers it.
- A missing service causes a penalty only when the Home's current Tier requires it.
- Losing coverage, for example when a capacity overflows because a neighbor upgrades, never downgrades a Home. It applies the penalty and blocks the next upgrade.
- Existing saves keep their Home Tiers. An Adaptation period suspends service penalties for loaded cities.
- Capacity depends on the facility Tier. See "Evolutions".

## Balancing (initial)

| Facility | Unlock (Citizens) | Urbs | Radius | Capacity | Footprint |
| --- | ---: | ---: | ---: | ---: | --- |
| School | 15 | 300 | 16 | 300 | 2×2 |
| Community hall | 32 | 150 | 6 | 150 | 1×1 |
| Middle school | 60 | 600 | 10 | 400 | 2×2 |
| High school | 100 | 1 000 | 12 | 600 | 3×2 |
| Hospital | 100 | 1 500 | 14 | 800 | 3×3 |
| Town hall | 160 | 2 000 | city | unlimited | 3×2 |
| Fire station | 160 | 1 000 | 18 | 800 | 2×2 |
| Police station | 160 | 1 000 | 18 | 800 | 2×2 |
| Theater | 250 | 800 | 10 | 500 | 2×2 |
| University | 400 | 3 000 | city | 2 000 | 3×3 |
| Concert hall | 600 | 2 000 | 14 | 1 200 | 3×3 |

- Every facility has electricity Demand comparable to a Tier 2 Home. Only the hospital has water Demand.
- Values are game indicators to tune during implementation; record adjustments in `balancing.md`.

## Evolutions

- Every facility with a limited capacity evolves through Tiers 1 to 8. Capacity is multiplied by 1, 1.5, 2, 3, 4, 5.5, 7 and 9.
- Upgrading costs Urbs only: 60 %, 120 %, 240 %, 400 %, 600 %, 900 % and 1300 % of the construction cost for Tiers 2 to 8.
- The Town hall (unlimited capacity) does not evolve. The University evolves; several Universities add their capacities.
- The selection panel shows Tier, reach, capacity, served Citizens and the upgrade action.

## Service vehicles

- Health and Safety facilities send Service vehicles: `ambulance`, `firetruck` and `police` from `assets/kenney/kenney_car-kit.zip`.
- They are visual only, with no gameplay effect, and are not saved.
- Each facility makes one round trip every 30–60 real seconds to a random covered Home, driven by the Seed. It has at most one vehicle at a time.
- A vehicle appears only when a road connects the facility to the Home.

## Models

- No dedicated models exist in the Kenney kits. Reuse commercial or industrial kit buildings fitted to their footprint (height growth capped), tinted by Service category, with a distinctive detail per facility.
- Hospital: white, with red crosses on the front, left and right faces. Fire station: red industrial hall with three garage doors on its front, larger than its footprint. Police station: blue. Town hall: larger than its footprint.
- Codex previews show facilities with their front toward the camera.

## UI

- Add a "Public facilities" build-menu section grouped by Service category.
- During placement, preview the coverage reach (orange, 25 % opacity) and the covered Homes. Selecting a facility shows the same reach.
- In the Home panel, list covered and missing services, why each is missing (out of reach, capacity full, none built) and the reason an upgrade is blocked.
- In the stats, add a Services section with coverage percentage per category.
- Add one Codex entry per facility, with FR/EN names and descriptions.
- Show a notification at each facility Unlock. There is no Tutorial step.

## Persistence

- Save version 8 accepts the new building types. Version 7 migrates and starts an Adaptation period for service penalties.

## Glossary

See `CONTEXT.md`: Well-being, Public facility, Service category, Service coverage, Service vehicle, Adaptation period.
