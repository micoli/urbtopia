# Urbtopia

Urbtopia is a solo, serverless isometric city builder: the player produces resources, spends them to grow a city, and manages its infrastructure. Playable in a browser on phone, tablet and desktop.

## Language

**Urbs**:
The soft currency of the game, earned by selling goods and spent on building and upgrading.
_Avoid_: Coins, cash, money

**Model definition**:
The entry of a 3D model in `assets/models.json`: footprint, scale or fit, rotation offset, recolor, and source license. Edited with `tools/assets-editor`; a model without one uses computed defaults.
_Avoid_: Asset config, model metadata

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

**Venue**:
A building the player fits out and runs from the inside: Arcade, Supermarket or Hotel. Unlike a Casino, the player never plays in it: simulated visitors do, and the player manages Fixtures, Staff and prices to earn Urbs. Its Tier sets the size of its interior and its number of Staff posts.
_Avoid_: Establishment, business, Casino

**Management view**:
The page that opens from a Venue's side panel and shows its interior, where the player builds Fixtures and hires Staff.
_Avoid_: Interior, editor, back office

**Fixture**:
An item the player places inside a Venue's interior: a counter, a table, a chair, a game machine, a billiard table, an air hockey table. Its position relative to the other Fixtures affects the Venue's performance.
_Avoid_: Furniture, equipment, decoration

**Staff**:
The workers of a Venue, held as roles, not as individuals: manager, employee, technician and security in an Arcade; manager, cashier, stocker and security in a Supermarket; manager, receptionist, housekeeper and technician in a Hotel. Each role fills a post of the Venue's Tier, is staffed by Citizens like a Job, and costs a daily wage in Urbs.
_Avoid_: Employee (one of the roles), worker, personnel

**Condition**:
The wear state of a Fixture, lowered by use. A Fixture whose Condition is too low breaks down and stops earning. It is never discarded for wear: it is repaired.
_Avoid_: Durability, health, usury

**Repair**:
The act of restoring a Fixture's Condition, paid in Urbs, by the player or by a Technician. A Repair always costs less than buying the Fixture again.
_Avoid_: Maintenance, replacement, fix

**Shelf**:
A Supermarket Fixture that holds units of one Good taken from the Storehouse, for a handling fee. It sells them to Shoppers at the value of the Good plus a markup; an empty Shelf earns nothing.
_Avoid_: Stand, rack, Shop stack

**Room**:
A Hotel bed with a bathroom piece within reach. A bed without one counts for nothing. The comfort Fixtures near it set its Standing.
_Avoid_: Suite, unit

**Standing**:
The class of a Room, from 1 to 3, set by the comfort of the Fixtures around its bed. It sets the rate of the Room.
_Avoid_: Stars, grade, Tier

**Reputation**:
The note, from 0 to 100, of a Hotel. It rises with the Standing and the cleanliness of its Rooms and falls with breakdowns, a shortage of housekeepers, or closure; it draws more or fewer guests from outside the city.
_Avoid_: Rating, score, fame

**Takings**:
The Urbs a Venue has earned and not yet collected, net of Staff wages and Fixture upkeep. Capped by the Venue's Tier like Tax, and collected by hand. A Venue whose wages cannot be paid closes.
_Avoid_: Revenue, income, till

**Visitor**:
A simulated customer of a Venue, modelled in aggregate. Arcade and Supermarket draw them from the surrounding Citizens; a Hotel draws them from outside the city, by the city's attractiveness and its Reputation. In a Supermarket they are called Shoppers, in a Hotel guests. Only a visual silhouette is shown, never saved.
_Avoid_: Customer, guest, Citizen

**Vehicle**:
A visual automobile that drives along the roads. It is a projection of the city's Congestion: its presence follows the Commuters who drive, two Vehicles never overlap, and individual Vehicles are not saved.
_Avoid_: Car, automobile

**Service vehicle**:
A visual ambulance, fire truck or police car that leaves its Public facility by road towards covered Homes. It has no gameplay effect and is not saved.
_Avoid_: Emergency, incident, Transit fleet

**Traffic**:
The set of Vehicles on the roads, whose size follows Commuters who drive instead of using public transport. The buses of the active Bus lines are part of it.
_Avoid_: Flow, cars

**Commute**:
The daily journey of a Home's Citizens who do not use public transport, from the Home to the workplaces (Workshop, Factory, Shop, Public facility, Leisure building) by the shortest road path. Commuters fill the nearest workplaces first, up to their Jobs; those who find none do not drive, and those whose workplace is within walking distance walk instead of driving. Modelled per Home in aggregate, never per individual Citizen.
_Avoid_: Individual Citizen journey, Transit itinerary

**Job**:
A place at a workplace that one Commuter can fill. A workplace offers a number of Jobs set by its type and Tier.
_Avoid_: Position, vacancy, employment

**Modal shift**:
The move of Commuters from car to public transport when their road is saturated: a share of a Home's Commuters becomes Riders, even beyond the usual 70% of Citizens, within the spare capacity of the Bus lines or other lines that serve the Home. Recomputed from the current Congestion each time, with no memory.
_Avoid_: Mode switch, migration, individual journey

**Commuter**:
A Citizen who drives on a Commute.
_Avoid_: Driver, rider (a rider uses public transport)

**Pedestrian path**:
The route on foot between a Building and a destination, over the sidewalks of the roads. Sidewalks are implicit on every Road tile and have two sides; a road is crossed only at a Crossing or around a dead end. Its length counts tiles walked plus a cost per Crossing crossed.
_Avoid_: Footpath, pavement, pedestrian way

**Sidewalk side**:
One of the two edges of a Road tile along which Citizens walk. The two sides of a straight tile are joined only by a Crossing.
_Avoid_: Pavement, kerb

**Walking trip**:
A trip on foot from a Home to a shop, school, health, culture, casino or park within walking distance. It adds no car demand, gives Well-being, and loads the Crossings it uses. Modelled per Home in aggregate.
_Avoid_: Stroll, individual journey

**Crossing**:
A straight Road tile where pedestrians can cross the road. The more pedestrians use it, the less capacity the road keeps for cars.
_Avoid_: Zebra, pedestrian crossing, crosswalk

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

**Water tile**:
A 1x1 tile laid by the player on free owned land to make it navigable. Boats are placed on Water tiles. Not to be confused with water as a utility (Water tower, Capacity, Demand).
_Avoid_: Lake, river, sea, pond

**Boat**:
A persistent object bought with Urbs and placed on a Water tile connected to a Marina. It is saved, and drifts visually over connected Water tiles. A Boat belongs to one family for life: Pleasure boat, Casino boat or Fishing boat.
_Avoid_: Vehicle (a visual projection, never saved), ship, watercraft

**Pleasure boat**:
A Boat that is a Leisure building: it raises the Well-being of nearby Homes, has an operating cost in Urbs and is never required. Unlike other workplaces it offers no Jobs. It has no effect when not connected to a Marina, or when its operating cost cannot be paid.
_Avoid_: Yacht, ferry

**Casino boat**:
A Boat that is a Casino: it offers Minigames under the same rules and has the same Tiers. It needs no power, so it is never shed on a shortage; it has an operating cost in Urbs equal to the energy bill of a Casino of the same Tier through Backup power. Without Urbs to pay it, it stops offering Minigames.
_Avoid_: Floating casino, riverboat

**Fishing boat**:
A Boat that produces a Material over a fixed production time, like a Workshop, with no Jobs and no Commute. The Material is stored in the Storehouse and turned into Goods by a Factory.
_Avoid_: Trawler, fisher

**Fish**:
The Material produced by a Fishing boat. A Factory turns it into Canned fish.
_Avoid_: Seafood, catch

**Canned fish**:
The Good a Factory makes from Fish, sold in Shops or to the Market.
_Avoid_: Fish product

**Marina**:
A building on land touching a Water tile, reached by Road. Boats can only be placed on the Water tiles connected to a Marina's; its Tier sets how many Boats it holds and how many Slots a Fishing boat has. It collects the operating cost of the Pleasure boats and Casino boats connected to it.
_Avoid_: Port, harbour, dock

**Bridge**:
A structure of fixed length (1, 2, 3 or 5 tiles) carrying a Road over Water tiles, from one bank to the other, aligned with a Road or Crossing at each end. It joins the Road graph. Boats cannot be placed on it but still navigate beneath it, and it opens for them: see Bridge opening.
_Avoid_: Viaduct, overpass

**Bridge opening**:
The raising of a Bridge in two leaves when a Boat has to pass beneath it, each leaf hinged on its bank (a 1-tile Bridge has one leaf; 3 tiles give 2 + 1, 5 tiles give 3 + 2). Traffic stops before it, like at a red light. Its cost is a closed fraction of time, from the Boats that can reach the Bridge, which lowers the capacity of its Road tiles.
_Avoid_: Lift, swing, drawbridge cycle

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
An ordered set of road-connected Bus stops, with operating costs and usage driven by useful residential and activity coverage. An active Bus line drives on the ordinary roads like any other Vehicle: it loads them and is slowed by their Congestion, which lowers its Effective speed and capacity.
_Avoid_: Individual Citizen journey, decorative Traffic

**Effective speed**:
The speed of a Bus line once the Congestion of its route is counted: each tile of the route takes longer in proportion to how far its section is above capacity, down to half of the nominal speed. Capacity and itinerary times follow it. BRT and rail are never slowed.
_Avoid_: Delay, journey time

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

**Access mode**:
A network a building can be reached from: the Road or the BRT corridor. Each building declares the modes it accepts. Homes, Leisure buildings, Shops and Public facilities accept both; every other building accepts the Road only. A position is valid when any accepted mode has a tile in front of the building.
_Avoid_: Entrance, connection type, requiresRoad

**BRT-only access**:
The state of a building reached by a BRT corridor but not by a Road. It has no Commute by car and no Pedestrian path: its Citizens use public transport, and the Jobs of its workplaces are filled by Riders only. A BRT-only Home with no BRT station covering it is marked disconnected.
_Avoid_: Roadless building, transit-only building

**Transit itinerary**:
A public transport journey linking a Home to an activity through one or more lines, with at most two Transfers.
_Avoid_: Infrastructure route, Individual Citizen simulation

**Player account**:
The anonymous identity a Cloud save belongs to, created silently on first play and bound to the device. The player can later attach an email to it to recover their city on another device.
_Avoid_: User, profile, login

**Cloud save**:
The copy of the city kept online for a Player account: the current one plus the 3 previous versions. The local save stays the source of truth; the Cloud save mirrors it.
_Avoid_: Remote save, sync, server save

**Save conflict**:
The situation where the local save and the Cloud save have both advanced since they last matched. The player chooses which one to keep; the other is kept as a previous version.
_Avoid_: Merge, overwrite

## Relationships

- A Cloud save never replaces the local save without the player's consent when a Save conflict exists.
- A Casino is a Leisure building, never a Public facility.
- A Venue is distinct from a Casino and a Shop: Minigames and Stakes belong to the Casino only.
- A breakdown of a Fixture is drawn from the Venue's own stream of the game's Seed, so reloading never dodges it.
- A Venue is simulated in aggregate per game tick, collected by hand like Tax, and replayed by Catch-up.
- A Pleasure boat is a Leisure building and a Casino boat is a Casino, both hosted by a Boat on a Water tile.
- Removing a Water tile that carries a Boat or a Bridge, a Marina that holds Boats, or a Water tile that would cut a Boat off its Marina is refused.
- A Bridge is part of the Road graph: Commute, Congestion and Pedestrian paths use it like any Road. Bridge openings lower its capacity in proportion to the Boats that can reach it.
- A building touching both a Road and a BRT corridor keeps the Road as its primary access, and its front faces the Road.
- Removing the last access of a building, Road or BRT corridor, is refused.
- Service vehicles stay on the network of their facility and never switch between Road and BRT corridor.
- A Casino is shed first when electricity falls short, before Homes, except during an Adaptation period. A Casino boat is never shed: it uses no power.
- A Minigame round of chance draws from the game's Seed; its outcome is fixed when the Stake is debited.
- A blockmatch round pays by stars on top of the returned Stake: none loses the Stake, 1 star wins 25% of it, 2 stars 50%, 3 stars 100%.

## Naming rules

- Common words are kept for Materials and Goods; invention is reserved for brand-like terms (game name, currency, market).
- No trademarked terms from other games in code, docs or UI.
- Code identifiers and this glossary are in English; UI strings are translated FR/EN. The game name and the currency name are identical in both languages.
