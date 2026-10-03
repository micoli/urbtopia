# Population, homes and utilities

Type: grilling
Status: resolved
Blocked by: 06, 07

## Question

Decide how homes grow through their 6 tiers, what upgrades cost, how population is computed, and how power and water capacity and demand work (placement, coverage, shortage effects, abandonment rules).

## Answer

Decided in three grilling rounds. All numbers are starting values for the later balancing pass.

**Home.** Placed at tier 1 only, cost 150 Urbs (sell refund 75 %, upgrades not refunded, per ticket 06). Upgrade is instant, one tier at a time, Goods taken from the Storehouse, new Citizens appear immediately.

| Tier | Citizens | Power / water demand | Upgrade to this tier |
|---|---|---|---|
| 1 | 6 | 1 | (placement, 150 Urbs) |
| 2 | 15 | 2 | 150 Urbs + 3 Planks |
| 3 | 32 | 3 | 400 Urbs + 4 Bricks + 2 Planks |
| 4 | 60 | 6 | 1,000 Urbs + 4 Tiles + 3 Bricks |
| 5 | 100 | 10 | 2,500 Urbs + 4 Tools + 3 Tiles |
| 6 | 160 | 16 | 6,000 Urbs + 4 Glass + 3 Circuits |

**Tax.** 1 Urb per Citizen per hour, capped 8 h per Home (ticket 07). No utility modifier.

**Utilities.** Global pools: total power capacity vs total power demand, same for water. Placed anywhere, no road, no radius, no network. Only Homes have demand (production buildings, Shop, Storehouse need nothing). One model of each, no upgrade, no count limit: Power plant 250 Urbs, capacity 12; Water tower 200 Urbs, capacity 12. Demand table is shared by power and water but kept as two data entries.

**Hard rules, no shortage state.** The pure core refuses, with an explicit message:
- placing a Home, or upgrading one, if it would push demand above capacity (power or water);
- selling a Power plant or Water tower if remaining capacity would fall below demand (same pattern as the Storehouse).
Therefore demand never exceeds capacity: no satisfaction ratio, no tax penalty, no abandonment, no "unserved" state. Roads cannot cause abandonment either (a building's only road cannot be demolished, ticket 06). Moving a plant or tower keeps its capacity.

**Parcels.** Cost = 300 Urbs x 1.12^n, n = Parcels bought so far, rounded to ten (about 940 at n=10, 8,800 at n=30, 240,000 at n=59). Data-driven table. Population gating belongs to ticket 09.

**Pacing.** First Home needs a Power plant (250), a Water tower (200) and the Home (150): 600 Urbs, exactly the start amount. Order of play ("first Shop before 5 min, first Home before 10 min") to be checked in the balancing pass; ticket 09 decides when Home, Power plant and Water tower unlock.

**Left to the fog.** Unserved/shortage mechanics return with coverage services (fire, police, health). The large power plant model stays in the fog.
