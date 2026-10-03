# Urbtopia

Urbtopia is a solo, serverless isometric city builder: the player produces resources, spends them to grow a city, and manages its infrastructure. Playable in a browser on phone, tablet and desktop.

## Language

**Urbs**:
The soft currency of the game, earned by selling goods and spent on building and upgrading.
_Avoid_: Coins, cash, money

**Material**:
A raw resource produced by a Workshop with a fixed production time.
_Avoid_: Raw good, ore, resource (too generic)

**Good**:
A manufactured item produced by a Factory from Materials, sold in Shops or to the Market.
_Avoid_: Product, item

**Workshop**:
A building that produces Materials.
_Avoid_: Raw factory, mine

**Factory**:
A building that turns Materials into Goods.
_Avoid_: Plant, mill

**Shop**:
A building that sells Goods to citizens for Urbs.
_Avoid_: Store, boutique

**Storehouse**:
The storage that holds Materials and Goods, with a limited capacity.
_Avoid_: Warehouse, depot, inventory

**Home**:
A residential building with six tiers (1 to 6) that houses citizens and upgrades by consuming Goods.
_Avoid_: House, residence, dwelling

**Tier**:
The level (1 to 6) of a Home. A higher Tier houses more Citizens and has a higher Demand.
_Avoid_: Level, grade

**Capacity**:
The amount of power or water a Power plant or Water tower supplies to the whole city.
_Avoid_: Output, supply

**Demand**:
The amount of power and water the Homes of the city require, set by their Tier. Total Demand can never exceed total Capacity.
_Avoid_: Consumption, load

**Citizen**:
A resident of a Home. The number of Citizens depends on the Home's tier and drives Tax and utility demand.
_Avoid_: Inhabitant, resident, sim

**Power plant**:
A building that supplies power capacity to the city.
_Avoid_: Generator, energy station

**Water tower**:
A building that supplies water capacity to the city.
_Avoid_: Pump, water plant

**Market**:
The simulated (non-player) buyer that purchases Goods from the player.
_Avoid_: Trade hub, exchange, auction

**Slot**:
A position in a building's production queue (or a Shop's sales stack). A building has 2 to 5 Slots; extra Slots are bought with Urbs.
_Avoid_: Lane, tray

**Tax**:
Urbs produced over time by the citizens of a Home, collected by hand.
_Avoid_: Rent, income

**Parcel**:
A 16x16 tile square of land; the player owns some and can buy adjacent ones with Urbs. Buildings must fit entirely inside owned Parcels.
_Avoid_: Plot, lot, zone, sector

**Catch-up**:
The single pass that applies everything that happened since the last time the game was open, up to 48 game hours.
_Avoid_: Offline progress, sync

**Unlock**:
The moment a Material, Good or building becomes available, triggered when the city's total Citizens reach a set threshold.
_Avoid_: Level up, tech tree, research

**Seed**:
The text code generated for each game that fixes all of its chance-based outcomes.
_Avoid_: Random key, map code

## Naming rules

- Common words are kept for Materials and Goods; invention is reserved for brand-like terms (game name, currency, market).
- No trademarked terms from other games in code, docs or UI.
- Code identifiers and this glossary are in English; UI strings are translated FR/EN. The game name and the currency name are identical in both languages.
