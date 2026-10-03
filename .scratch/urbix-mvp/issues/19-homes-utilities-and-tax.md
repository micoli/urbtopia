# 19: Homes, utilities and Tax

**What to build:** The player supplies power and water, places Homes and collects Tax. The first Home needs a Power plant, a Water tower and the Home itself.

**Blocked by:** 17

**Status:** resolved

- [x] Home placed at Tier 1 for 150 Urbs (6 Citizens, Demand 1 power and 1 water); Power plant 250 Urbs and Water tower 200 Urbs, each Capacity 12, no road required, no radius
- [x] Power and water are global pools; Demand and Capacity are two separate data entries
- [x] Placing a Home is refused when Demand would exceed Capacity, with an explicit message
- [x] Selling a Power plant or Water tower is refused if remaining Capacity would fall below Demand; moving one keeps its Capacity
- [x] Tax is 1 Urb per Citizen per hour, capped at 8 h per Home, collected by hand through a collect badge
- [x] HUD shows total Capacity and Demand for power and water, and total Citizens
- [x] Property test: Demand never exceeds Capacity after any valid command sequence
- [x] Scenario test: 600 starting Urbs exactly pay for the first Home plus Power plant and Water tower
