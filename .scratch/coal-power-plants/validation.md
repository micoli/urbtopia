# Coal delivery validation

## Delivered behavior

- Road-free Coal Power plants are available from the start at 150 Urbs. Four Tiers provide stable Capacity 12, 24, 40 and 64 and render the requested chimney models.
- Fuel costs 0.05 Urbs per delivered energy unit-hour without consuming the stored coal Material. Generation serves Demand after renewables but before batteries and backup; fossil generation never charges batteries.
- On/off choices persist in save version 6. Frozen version-4 and version-5 cities preserve their buildings, inventory and transit configuration.
- Local well-being penalties scale with plant utilization within Manhattan radius 6, cap at 20 points per Home, and limit the Tax reduction to 2% of base Tax. Green-space benefits remain distinct from energy emissions.
- FR/EN construction, selection, upgrades, costs, emissions, Home penalties and city statistics explain the tradeoff. The Codex provides four distinct coal previews, including offline caching.

## Reference-city evidence

Rates below use Homes without green-space benefits. Tax accrual is fractional; manual collection rounds down to whole Urbs.

| City | Delivered coal | Operating Urbs/hour | Local penalty | Evidence |
| --- | ---: | ---: | --- | --- |
| Six-Citizen starter, one Tier-1 plant | 1 | 0.05 | 0.833 points; 5.995 Urbs/hour Tax accrual | Local penalty and exact budget-exhaustion tests |
| 400-Citizen Home, four nearby Tier-1 plants | 40 | 2 | Capped at 20 points; 392 Urbs/hour Tax | Overlapping-pollution and affordability test |
| Mixed city: wind, Tier-1 coal, charged battery and backup | 12 | 0.6 coal + 3.8 backup | Proportional to coal utilization | Dispatch test: wind 8.4, coal 12, battery 12, backup 7.6 supply Demand 40 |
| Idle plant beside an empty battery | 0 | 0 | No emissions or local penalty | Idle-capacity and no-fossil-charging test |
| No operating budget | 0 | 0 | No current coal penalty | Exhaustion, collection/resumption and live/Catch-up property tests |

Coal has a lower upfront price and a sustainable operating burden in these cases; wind's lack of fuel expense can win over a sufficiently long time horizon. Balancing remains tunable.

## Related fixes

- Reproduced the Storehouse sale popup with a single native touch tap when the newly opened sale button appears under the finger. Selection previously ran on pointer release, before the browser-generated click; it now runs on that click. The regression verifies both mouse and touch selection and requires a separate sale-button click to open confirmation.
- Added the city-management icon to the shared navigation, including the minimal layout's radial menu and the left Dock. Increased the radial radius to keep the added action from overlapping adjacent controls.

## Verification

- `npm test`: 567 tests pass, including allocation, pollution, budget exhaustion, Time skip, Catch-up partitioning and frozen save compatibility.
- `npm run lint`: passes.
- `npm run build`: passes and provisions all four models and Codex images.
- `npm run test:gameplay`: six browser tests cover Storehouse regression, coal controls/upgrades/save restoration on desktop and touch, and management shortcuts in layouts B/C.
- `npm run test:codex`: nine browser tests pass across layouts A/B/C, desktop/mobile, deployed previews and offline caching.
- Visually inspected the Tier-4 Codex preview and the mobile coal selection panel.
