# 13: Roads and placement rules

**What to build:** The core enforces placement rules and the player can draw roads, place, sell, move and demolish through commands, visible in the scene (a minimal temporary trigger is acceptable until ticket 14 delivers the build UX). Rules from the city grid decisions (ticket 06).

**Blocked by:** 12

**Status:** ready-for-agent

- [x] Roads drawn as an L-shaped drag with total cost (fixed cost per tile); pieces chosen automatically from the neighbour mask using the 8 catalog pieces; roundabout (3x3) and crossing are separate tools
- [x] Placement valid only if the whole footprint is inside owned Parcels, tiles are free, and (for Home, Shop, Factory, Workshop, Storehouse) a front-edge tile touches a road; Power plant and Water tower need no road
- [x] Auto-orientation toward the adjacent road, with a manual rotate override
- [x] Sell refunds 75 % of placement cost; demolishing a building's only road is refused with an explicit message
- [x] Moving a building is free (resetting its running production is deferred to ticket 15, there is no production yet)
- [ ] Selling a Storehouse is refused if remaining capacity would be below stock (deferred to ticket 15, there is no stock yet)
- [x] Core tests cover every refusal reason via `dispatch`
