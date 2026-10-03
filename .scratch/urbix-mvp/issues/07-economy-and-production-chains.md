# Economy and production chains

Type: grilling
Status: resolved
Blocked by: 01

## Question

Design the MVP economy using the original names: materials and times, factories and slots, intermediate goods, shops, currency sources and sinks, storage capacity, and how the NPC market buys. Use `docs/research/reference-city-builder-mechanics.md` as input, not as a copy: numbers should be ours.

## Answer

Economy decided in a three-round grilling. All numbers are starting values for the later balancing pass.

**Roles.** Workshop makes Materials. Factory turns Materials into Goods. Shop sells Goods to citizens (regular income, full price, slow). Market is the always-available NPC buyer (instant, reduced price, saturating). Materials are never sold; only Goods have Urbs value.

**Generic buildings.** Any Workshop makes any unlocked Material, any Factory any unlocked recipe, any Shop sells any Good. One version of each building at the MVP. Constraint comes from slots, queue and Storehouse.

**Materials** (Workshop time, internal value): Wood 1 min (4), Stone 2 min (9), Clay 4 min (20), Metal 8 min (44), Silicon 16 min (96).

**Goods** (one level only; recipe, Factory time, base sale value):

| Good | Recipe | Time | Value |
|---|---|---|---|
| Planks | 2 Wood | 2 min | 14 |
| Bricks | 2 Stone + 1 Wood | 4 min | 34 |
| Tiles | 2 Clay | 6 min | 62 |
| Tools | 1 Metal + 1 Wood | 8 min | 80 |
| Glass | 2 Clay + 1 Silicon | 12 min | 190 |
| Circuits | 1 Metal + 1 Silicon | 16 min | 230 |

**Slots.** Per building, FIFO queue (slot = queue position, production sequential), manual collect. Start 2 slots, extra slot bought in Urbs: slot 3 = 500, slot 4 = 1,500, slot 5 = 4,000 (max 5, same for Workshop, Factory, Shop). Bought slots are not refunded on sale.

**Storehouse.** One per city. Two compartments: Materials 20, Goods 40. Five upgrades (+10 Materials, +20 Goods each) costing 300, 800, 2,000, 5,000, 12,000; final 70 / 140. Full compartment blocks collection; finished production stays in its slot, nothing is lost.

**Shop.** 3 slots. A slot takes a stack of 5 units of one Good from the Storehouse; citizens buy 1 unit per 45 s at 100 % of base value. Urbs accumulate in the Shop (capped at one stack's value per slot), collected manually.

**Market.** Not a building: an always-available "Sell" panel, unlocked with the first Good. Pays 60 % of base value. Each unit sold of the same Good removes 5 points of multiplier (floor 30 %); recovery linear, 0 to full in 1 h. No random fluctuation (deterministic, easy to test).

**Tax.** 1 Urb per citizen per hour, accumulation capped at 8 h, collected manually on each Home. Citizens per tier: see ticket "Population, homes and utilities".

**Sources of Urbs.** Shop sales, Market sales, tax. **Sinks.** Constructions, Parcels, slots, Storehouse upgrades, Home upgrades (Urbs plus Goods). No continuous maintenance (would punish absence).

**Start.** 600 Urbs, 2x2 Parcels owned, one free Workshop and one free Factory pre-placed. Costs: Workshop 100, Factory 250, Shop 300, Storehouse 400. Target pacing: first Shop and first sales before 5 min of play, first Home before 10 min. Parcel and Home costs belong to ticket 08. Unlock order of Materials, Goods and buildings belongs to ticket 09.
