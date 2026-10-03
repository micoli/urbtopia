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
The general storage that holds Materials and Goods, with a limited capacity. Only one can be built; it has Tiers that raise its capacity.
_Avoid_: Warehouse, depot, inventory

**Silo**:
A specialized storage that adds capacity to the Materials compartment only. Only one can be built; it has Tiers.
_Avoid_: Granary, bin

**Vault**:
A specialized storage that adds capacity to the Goods compartment only. Only one can be built; it has Tiers.
_Avoid_: Cellar, depot

**Home**:
A residential building with six Tiers (1 to 6) that houses citizens and upgrades by consuming Goods.
_Avoid_: House, residence, dwelling

**Tier**:
The level of an upgradable building (Home, Workshop, Factory, Storehouse, Power plant, Water tower). A higher Tier improves the building: a Home houses more Citizens and has a higher Demand; a Workshop or Factory produces faster, gains Slots, yields more per cycle and can produce exclusive Materials or Goods.
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

**Vehicle**:
A purely decorative car that drives along the roads. It has no effect on the simulation and is not saved.
_Avoid_: Car, automobile

**Traffic**:
The set of Vehicles on the roads, whose size follows the city's total Citizens.
_Avoid_: Flow, cars

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

**Tutorial**:
The guided sequence of steps played at the start of a new game, where the player places the first buildings to lay a solid base. It can be skipped at any time.
_Avoid_: Onboarding, intro, walkthrough

**Time skip**:
The player action that advances game time by a set number of hours or up to the end of a Tutorial step.
_Avoid_: Time warp, fast-forward

**Seed**:
The text code generated for each game that fixes all of its chance-based outcomes.
_Avoid_: Random key, map code

## Naming rules

- Common words are kept for Materials and Goods; invention is reserved for brand-like terms (game name, currency, market).
- No trademarked terms from other games in code, docs or UI.
- Code identifiers and this glossary are in English; UI strings are translated FR/EN. The game name and the currency name are identical in both languages.
