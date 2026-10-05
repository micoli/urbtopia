# Urbtopia

Urbtopia is a solo, serverless isometric city builder: the player produces resources, spends them to grow a city, and manages its infrastructure. Playable in a browser on phone, tablet and desktop.

## Language

**Urbs**:
The soft currency of the game, earned by selling goods and spent on building and upgrading.
_Avoid_: Coins, cash, money

**Material**:
A raw resource produced by a Workshop with a fixed production time, or harvested from a Crop.
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

**Farm**:
A building that holds the player's seed stock and is the entry point of cultivation. It does not produce anything itself.
_Avoid_: Workshop, plantation

**Field**:
A tile laid by the player on free owned land to make it cultivable. Crops are planted on Field tiles and harvested from them.
_Avoid_: Plot, parcel, farmland, zone

**Crop**:
A species planted on a Field tile. Each species has its own growth time and water Demand, and goes through four growth stages before being ready to harvest.
_Avoid_: Plant, vegetable

**Seed pack**:
The unit of seeds needed to plant one Field tile, bought with Urbs and kept in the Farm's seed stock. Part of each harvest is converted back into Seed packs.
_Avoid_: Seed (already the game code), grain

**Harvest**:
The player gesture that collects ready Crops by pressing a ready Field's bubble and dragging over the others in one sweep. The yield becomes a Crop Material, stored in the Grain silo; a share of it is converted back into Seed packs.
_Avoid_: Picking, gathering

**Packhouse**:
A building that packs Crop Materials into packed Goods, the only way to sell a Harvest. Only one can be built; it has Tiers.
_Avoid_: Factory, cannery, packing plant

**Storehouse**:
The general storage that holds Materials and Goods, with a limited capacity. Only one can be built; it has Tiers that raise its capacity.
_Avoid_: Warehouse, depot, inventory

**Silo**:
A specialized storage that adds capacity to the Materials compartment only. Only one can be built; it has Tiers.
_Avoid_: Granary, bin

**Grain silo**:
A specialized storage that holds Crop Materials only, in a compartment of its own that the Storehouse and the Silo do not share. The Farm provides a small base capacity so the first Harvest is never blocked. Only one can be built; it has Tiers.
_Avoid_: Barn, granary, Silo (already the Materials storage)

**Vault**:
A specialized storage that adds capacity to the Goods compartment only. Only one can be built; it has Tiers.
_Avoid_: Cellar, depot

**Home**:
A residential building with eight Tiers (1 to 8) that houses citizens and upgrades by consuming Goods.
_Avoid_: House, residence, dwelling

**Tier**:
The level of an upgradable building (Home, Workshop, Factory, Storehouse, Power plant, Water tower). A higher Tier improves the building: a Home houses more Citizens and has a higher Demand; a Workshop or Factory produces faster, gains Slots, yields more per cycle and can produce exclusive Materials or Goods.
_Avoid_: Level, grade

**Capacity**:
The amount of power or water a Power plant or Water tower supplies to the whole city.
_Avoid_: Output, supply

**Demand**:
The amount of power and water the city requires: Homes need power and water according to their Tier, and economic buildings also need power. Electricity Demand can exceed available production, reducing service; water Demand cannot exceed water Capacity.
_Avoid_: Consumption, load

**Citizen**:
A resident of a Home. The number of Citizens depends on the Home's tier and drives Tax and utility demand.
_Avoid_: Inhabitant, resident, sim

**Well-being**:
The satisfaction of a Home's Citizens, raised by nearby Green spaces and Public facility coverage, lowered by coal pollution, missing services and Congestion on its Commute. It modulates the Home's Tax.
_Avoid_: Happiness, bonheur, mood, attractiveness

**Public facility**:
A building that serves Citizens with a public service in a Service category, at no operating cost. Its Tier raises its Citizen capacity; the Town hall has no Tier.
_Avoid_: Civic building, public service, amenity

**Service category**:
The family of service a Public facility provides: Education, Administration, Culture, Health or Safety.
_Avoid_: Department, sector

**Service coverage**:
The state of a Home being served by a Public facility of a Service category: within the facility's reach (a square of twice its radius with corners rounded by 3 tiles) and inside its Citizen capacity, nearest Homes first. The Home that crosses the capacity is still served, so a single large Home can always be covered. Some facilities cover the whole city. Missing coverage lowers Well-being and can block Home Tier upgrades.
_Avoid_: Service range, zone

**Leisure building**:
A building that entertains Citizens and raises the Well-being of nearby Homes. Unlike a Public facility it belongs to no Service category: its absence never lowers Well-being or blocks a Tier upgrade. It is not free to use.
_Avoid_: Amusement, entertainment venue, Public facility

**Casino**:
A Leisure building with Tiers where the player plays Minigames with Urbs. Several can be built. It consumes much more power than other buildings and is shut down when not powered.
_Avoid_: Gambling hall, arcade

**Minigame**:
A game played in a Casino: the slot machine, blackjack or blockmatch. Each Minigame requires a minimum Casino Tier and a Casino offers all the Minigames of its Tier and below. A Minigame in progress is never saved.
_Avoid_: Game (already the whole city builder), attraction

**Round**:
One play of a Minigame, from the moment its Stake is debited to its payout. The slot machine settles at once; blackjack and blockmatch last until the player finishes, and a Round left unfinished loses its Stake.
_Avoid_: Hand, spin, game

**Stake**:
The Urbs the player puts on a Minigame round, from fixed steps capped by the Casino's Tier and never above the Urbs balance. It is debited when the round starts and lost if the round is left unfinished.
_Avoid_: Bet, wager, buy-in

**Vehicle**:
A visual automobile that drives along the roads. It is a projection of the city's Congestion: its presence follows the Commuters who drive, two Vehicles never overlap, and individual Vehicles are not saved.
_Avoid_: Car, automobile

**Service vehicle**:
A visual ambulance, fire truck or police car that leaves its Public facility by road towards covered Homes. It has no gameplay effect and is not saved.
_Avoid_: Emergency, incident, Transit fleet

**Traffic**:
The set of Vehicles on the roads, whose size follows Commuters who drive instead of using public transport.
_Avoid_: Flow, cars

**Commute**:
The daily journey of a Home's Citizens who do not use public transport, from the Home to the workplaces (Workshop, Factory, Shop, Public facility, Leisure building) by the shortest road path. Modelled per Home in aggregate, never per individual Citizen. A workplace has no job limit yet.
_Avoid_: Individual Citizen journey, Transit itinerary

**Commuter**:
A Citizen who drives on a Commute.
_Avoid_: Driver, rider (a rider uses public transport)

**Lane**:
A traffic channel of a Road in one direction. The number of Lanes comes from the Road's Tier and sets its capacity.
_Avoid_: Track, way

**Road tier**:
The upgradable level of a Road tile, giving it 1, 2 or 3 Lanes per direction.
_Avoid_: Avenue, road type

**Congestion**:
The state of a Road section whose Commuters exceed its Lane capacity. The bottleneck of a Commute is its lowest-capacity section. A connected set of Roads that serves Homes but no workplace, or workplaces but no Home, is a disconnected section, marked with a red cross; the Commute of its Homes is at maximum Congestion.
_Avoid_: Jam, bouchon

**Power plant**:
A building that supplies power to the city, using wind or coal. Backup generation is a separate service role.
_Avoid_: Generator, energy station

**Coal Power plant**:
A polluting Power plant that supplies stable power from coal and reduces nearby Citizen well-being. It allows the player to power an entire city with coal.
_Avoid_: Wind turbine, Factory

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

**Solar Home**:
A Home equipped with panels that first cover its own power Demand and can share surplus with nearby Homes.
_Avoid_: Solar house, solar residence

**Insulation**:
A paid Home improvement that reduces power Demand independently of solar equipment.
_Avoid_: Energy generation, Home Tier

**Solar installation**:
A standalone neighborhood building that produces power from daylight and occupies land.
_Avoid_: Solar Home, generator

**Neighborhood battery**:
A building that stores nearby renewable surplus and supplies nearby demand during deficits.
_Avoid_: Power plant, energy generator

**Backup Power plant**:
A dispatchable polluting source that supplies deficits at an operating cost in Urbs.
_Avoid_: Wind turbine, free power

**Green space**:
A natural element or small park that supports nearby cooling, biodiversity or Citizen well-being, with diminishing returns. Vegetation provides comfort; rocks, logs and stumps support biodiversity near vegetation.
_Avoid_: Carbon offset, universal pollution compensation

**Bus stop**:
A visible roadside sign marking a public-transport stop that covers nearby Homes and activity locations.
_Avoid_: Road STOP sign, station

**Bus line**:
An ordered set of road-connected Bus stops, with operating costs and usage driven by useful residential and activity coverage.
_Avoid_: Individual Citizen journey, decorative Traffic

**Adaptation period**:
The announced grace period during which new electricity shortages or newly required Service coverage do not penalize production, Tax or Well-being.
_Avoid_: Permanent exemption, free energy

**BRT corridor**:
A dedicated infrastructure for bus rapid transit, separate from the ordinary road network. A crossing with a Road does not connect the two networks.
_Avoid_: Ordinary Road, Bus line

**Railway**:
Transport infrastructure on which Trains run, independently of their propulsion type.
_Avoid_: Electric Railway, Coal Railway

**Train**:
A rail vehicle purchased by the city through City Management, with electric or coal propulsion.
_Avoid_: Railway, Traffic Vehicle

**Transit fleet**:
The city's purchased BRT vehicles and Trains, which can be assigned to transport lines. Each vehicle belongs to at most one line at a time.
_Avoid_: Traffic, Bus line

**Transfer**:
A change between public transport lines during a Citizen's journey, including changes between ordinary buses, BRT and Trains.
_Avoid_: Infrastructure crossing, Network connection

**Headway**:
The interval between successive vehicles serving a transport line.
_Avoid_: Vehicle speed, Journey duration

**BRT station**:
An accessible stop served by electric BRT vehicles on a BRT corridor. Nearby public transport stops can provide Transfers.
_Avoid_: Bus stop, Railway station

**Railway station**:
A passenger stop on a Railway, served by Trains assigned to Railway lines.
_Avoid_: BRT station, Freight terminal

**Transit itinerary**:
A public transport journey linking a Home to an activity through one or more lines, with at most two Transfers.
_Avoid_: Infrastructure route, Individual Citizen simulation

## Relationships

- A Casino is a Leisure building, never a Public facility.
- A Casino is shed first when electricity falls short, before Homes, except during an Adaptation period.
- A Minigame round of chance draws from the game's Seed; its outcome is fixed when the Stake is debited.
- A blockmatch round pays by stars on top of the returned Stake: none loses the Stake, 1 star wins 25% of it, 2 stars 50%, 3 stars 100%.

## Naming rules

- Common words are kept for Materials and Goods; invention is reserved for brand-like terms (game name, currency, market).
- No trademarked terms from other games in code, docs or UI.
- Code identifiers and this glossary are in English; UI strings are translated FR/EN. The game name and the currency name are identical in both languages.
