# City grid and placement rules

Type: grilling
Status: resolved
Blocked by: 05

## Question

Decide grid size and unit, buildable land and expansion, building footprints and rotation, road adjacency rules (must a building touch a road?), road drawing/demolition behaviour, selling and moving buildings.

## Answer

- **Grid**: fixed 128x128 tiles, 1 tile = 1 road tile, flat uniform terrain (no obstacles). The seed only varies building model choice, not terrain.
- **Parcels**: the map is 8x8 parcels of 16x16 tiles (aligned on render chunks). New game starts with the central 2x2 parcels (32x32) owned and nothing placed; starting Urbs set in the economy ticket.
- **Expansion**: buy parcels one by one with Urbs, each adjacent to an owned parcel. Cost = base x factor^n, data-driven table, values left to the economy ticket. Population gating left to the progression ticket.
- **Placement validity** (pure core check): whole footprint inside owned parcels, tiles free, and for Home/Shop/Factory/Workshop/Storehouse/Market at least one front-edge tile touches a road. Power plant and Water tower need no road. No connectivity to an entry point in the MVP.
- **Rotation**: auto-orient the front towards the adjacent road on placement, rotate button to override; green/red ghost while placing.
- **Roads**: drag in an L shape with preview and total cost, fixed cost per tile, piece chosen automatically from the neighbour mask (8 catalog pieces). Roundabout (3x3) and crossing are separate tools. Demolishing a road is refused if it is the only road of a building, with an explicit message.
- **Selling**: refund 75 % of placement cost; Home upgrades are not refunded. Confirmation for Home tier >= 3 and non-empty Storehouse. Selling a Storehouse is refused if the remaining capacity would be below the stock.
- **Moving**: free, resets the building's running production; otherwise sell and rebuild.
