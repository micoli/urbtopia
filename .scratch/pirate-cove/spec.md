Status: ready-for-agent

# Pirate cove

A new Arena on the shore: Pirate ships perform Shows in front of Stands, on water dressed with Desert islands and Sea forts. Vocabulary: see `CONTEXT.md` (Pirate cove, Pirate ship, Stands, Desert island, Sea fort, Arena, Show, Gathering, Ticket, Takings, Water tile, Boat). Decisions: ADR 0053, ADR 0054.

## Rules

- Pirate cove: a building type of its own, not a Marina. It touches a Water tile and is reached by Road. Fixed footprint of 3x3, 3 Tiers. It holds only Pirate ships, and a Marina holds none.
- It is an Arena: no Show, nobody and no earnings; Takings have no cap, collected by hand. It counts in the city's attractiveness.
- Show: same rules as the other Shows. Programmed by the player, now or in 1 to 24 hours, at most one waiting, 12-hour cooldown, cancelled before it starts for half of its cost back, same four phases, same 3 Tickets. Tourists and Citizens in reach make the crowd. No Artist.
- Show title: drawn when programmed from a fixed list of invented names, in English and French (for example "The Kraken's Revenge" / « La Revanche du Kraken »). No real or trademarked name. It has no effect on figures and is saved with the Gathering.
- A Show needs at least one Pirate ship and one seat, and only the Pirate ships of that Pirate cove and its Stands count.
- Capacity: the seats of its Stands, capped by Tier at 400, 800 and 1,200. Seats beyond the cap do not count.
- Crowd: capacity x fill, as for other Shows, with quality fixed at the default 0.5. Pirate ships do not change the crowd.
- Revenue: crowd x Ticket x spending x `1 + 0.15 x (Pirate ships - 1)`.
- Cost of a Show: 0.4 Urbs per seat that counts + 150 Urbs per Pirate ship.
- Figures are fixed when the Show is programmed. From then until it is settled or cancelled, its Pirate ships and Stands cannot be sold. Pirate ships or Stands added meanwhile, or a Tier upgrade, count from the next Show.

### Pirate ships

- A new Boat family. It uses the existing `vehicles/pirate-ship` model. Bought and placed like other Boats, it belongs to one Pirate cove for life. No hourly operating cost.
- At most `floor(navigable connected Water tiles / 12)` Pirate ships per body of connected water, shared between all Pirate coves on it. Other Boats do not count. Pirate cove Tiers do not change this limit.
- Removing a Water tile is refused if it would leave a body of water under the limit, or cut a Pirate ship off its Pirate cove.
- It drifts 2.5 times faster than other Boats (0.30 tiles/s) with rests half as long, at all times. This is visual only: in a Bridge opening it weighs like any Boat.

### Stands

- Three sizes, placed on land touching a Water tile connected to a Pirate cove. No Road needed. Refused if no Pirate cove is connected.

| Size | Seats | Cost |
| --- | --- | --- |
| 1x3 | 60 | 300 Urbs |
| 2x4 | 200 | 1,000 Urbs |
| 3x6 | 500 | 2,500 Urbs |

- Stands belong to the nearest Pirate cove when placed, the lowest id on a tie, and this link is saved. Placing a new Pirate cove never moves them.
- A Pirate cove with Pirate ships or Stands cannot be removed. Removing a Water tile that would cut Stands off their Pirate cove is refused.
- Moving Stands keeps their Pirate cove and is refused if they would no longer touch its connected water.

### Desert islands and Sea forts

- Desert island 2x2. Sea forts 3x3, 3x4 and 4x4. Only on Water tiles, inside owned parcels. No effect on the city's figures.
- The Water tiles beneath stay Water tiles but are no longer navigable: not counted in the Pirate ship limit or the Flow factor, not used to link water, and Boats do not drift over them. Selling the scenery makes them navigable again; a Water tile under scenery cannot be removed.
- Laying is refused if any tile is not water, or carries a Boat or a Bridge; if it would cut a Boat or Stands off its building; or if it would leave a body of water under the Pirate ship limit.

### Prices and unlocks

All at 800 Citizens, in the `build.water` section, editable in `tools/assets-editor`.

| Item | Cost |
| --- | --- |
| Pirate cove | 10,000 Urbs |
| Tier 2 / Tier 3 | 15,000 / 30,000 Urbs |
| Pirate ship | 5,000 Urbs |
| Desert island | 150 Urbs |
| Sea fort 3x3 / 3x4 / 4x4 | 600 / 800 / 1,100 Urbs |

Target, at Ticket 8, Well-being 50%, no Hotel, full crowd: about 17,000 Urbs for 1,250 net per Show at the start (1 ship, 400 seats), about 81,000 Urbs for 5,700 net per Show at the top (Tier 3, 4 ships, 1,200 seats), next to a Concert hall at Tier 8 (about 74,000 Urbs, 4,290 per Show before its costs).

## Playing it

- A Show is programmed in the existing Radix `Dialog`, without Artists: the title drawn, the Ticket, the start, the live forecast, with Pirate ships and seats that count. If there is no Pirate ship or no seat, the confirm button is disabled with its reason.
- Its side panel shows the Pirate ships, the limit of the water, the seats against the Tier cap, and buys Pirate ships. It has the same three states as other Arenas.
- A locked Pirate ship or Stands states why it cannot be sold.
- During the under way phase, Pirate ships fire cannon puffs and keep drifting. The crowd sits on the Stands rather than around the building. Effects stop under `prefers-reduced-motion`. No effect on the game.
- The build menu gives Stands their seats. Badges, toasts and the Tourism section treat it like any Arena, and the toasts name the title of the Show.

## Models

10 new models, made one at a time in Blender with English signs: 3 Pirate cove Tiers, 3 Stands, 1 Desert island, 3 Sea forts.

## Code touched

- `SHOW_TYPES`, `ARENA_TYPES`, `GATHERING.capacity`, `gatheringCapacityOf` and `gatheringCostOf`: seats come from Stands, not the fixed capacity or `tierBonus`.
- `previewGathering` and `scheduleShow`: ship boost, cost per ship, title and refusals.
- `BOATS`, `BOAT_FAMILIES`, the boat schema, `buyBoat`, `sellBoat`, `marinaOf`, `isBoatOperating`: a family bound to a Pirate cove, with no operating cost.
- `occupiedTiles` and `placementIssue`: scenery is the only thing placed on water.
- Each of the 5 `waterKeys` callers: decide between all Water tiles and navigable ones (`connectedWaterKeys`, drift and the Flow factor use navigable ones).
- `removeWater`: new refusals.
- `DRIFT_SPEED` and rests per family in `boatDrift`.
- `AttractionCrowdLayer`: figures on the Stands.
- `persistence/validate.ts`: the new family, the Stands link and the Show title.
- Guide: `tourism.en.mdx`, `tourism.fr.mdx`.

## Out of scope

Choreographed battles, Show quality from scenery, a title chosen by the player, Pirate ships in a Marina, scenery on land, a feature flag (it ships directly).
