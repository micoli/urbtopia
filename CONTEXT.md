# Urbtopia

Urbtopia is a solo, serverless isometric city builder: the player produces resources, spends them to grow a city, and manages its infrastructure. Playable in a browser on phone, tablet and desktop.

## Language

**Urbs**:
The soft currency of the game, earned by selling goods and spent on building and upgrading.
_Avoid_: Coins, cash, money

**Game object**:
Any kind of thing of the game described by data rather than code: a Building, a Fixture, a Vehicle, a Service vehicle, a Transit fleet vehicle, a Boat, a Material, a Good, a Crop or an Orchard tree. Its definition, including its values per Tier, is edited in `tools/assets-editor`; the rules that use those values stay in code.
_Avoid_: Item (a Good), asset, entity, prefab

**Retired**:
The state of a Game object that can no longer be built, bought or unlocked, but still exists and works in the cities that already have it. A Game object is retired rather than removed, because its id lives in saves.
_Avoid_: Deleted, deprecated, removed

**Model id**:
The stable name of a 3D model, chosen by hand and independent of where its file lives. Game objects refer to models by Model id only; moving or renaming the file never changes it.
_Avoid_: Model key, model path, asset id

**Model definition**:
The entry of a 3D model, identified by its Model id: its file, footprint, scale or fit, rotation offset, recolor, and source license. Edited with `tools/assets-editor`; a model without one uses computed defaults.
_Avoid_: Asset config, model metadata

**Material**:
A raw resource produced by a Workshop with a fixed production time, or harvested from a Crop.
_Avoid_: Raw good, ore, resource (too generic)

**Good**:
A manufactured item produced by a Factory from Materials, sold in Shops or to the Market, or given to an association as a Donation.
_Avoid_: Product, item

**Workshop**:
A building that produces Materials.
_Avoid_: Raw factory, mine

**Factory**:
A building that turns Materials into Goods.
_Avoid_: Plant, mill

**Mill**:
A Workshop that turns Wheat into Flour and Olives into Olive oil.

**Bakery**:
A Factory that turns Flour and other Materials into Food Goods, and sells those Goods itself over its Counter.

**Counter**:
The sales Slots of a Production building that sells some Goods itself. The Bakery, the Dairy and the Knitwear factory each have one, with three Slots whatever its Tier, apart from its production Slots; it sells only the Goods its definition lists and is stocked from the Storehouse like a Shop.
_Avoid_: Shop (a Shop is a building of its own)

**Shop**:
A building that sells Goods to citizens for Urbs. There is one Shop per Good category, each with four Tiers; it sells only the Goods of its Good category that its Tier makes available. The General shop is the exception: it sells the Goods of every Good category available at its Tier, and costs more to build, to upgrade and to extend with Slots.
_Avoid_: Store, boutique

**Good category**:
The family a Good belongs to (Construction, Food, Equipment or Luxury). A Good belongs to exactly one Good category. Each Shop is tied to one Good category and sells only Goods of that category; the General shop is tied to all of them.
_Avoid_: Shop type, Service category (that is for Public facilities)

**General shop**:
The original Shop, kept in the cities that have it and still buildable: it sells Goods of every Good category but costs more than a specialised Shop.
_Avoid_: Universal shop, Retired shop

**Build limit**:
The number of copies of a building the player may own at once. It rises with the Citizens count, by thresholds set for each building, and its list of thresholds gives the maximum. Applies to the Farm, Livestock farm, Packhouse, Storehouse, Material depot, Vault, Grain silo, Office building, Hydro power plant and Geothermal power plant.
_Avoid_: Quota, cap (already the Field cap)

**Escalating price**:
The cost of the next copy of a building under a Build limit: its base cost multiplied by a factor (2 by default) for each copy already built.
_Avoid_: Repeat price, surcharge

**Farm**:
A building that holds the player's seed stock and is the entry point of cultivation. It does not produce anything itself. Several can be built, up to its Build limit; their seed capacities, Field caps and base Crop capacities add up, while Fields and the seed stock stay shared by the whole city.
_Avoid_: Workshop, plantation

**Field**:
A tile laid by the player on free owned land to make it cultivable. Crops are planted on Field tiles and harvested from them.
_Avoid_: Plot, parcel, farmland, zone

**Crop**:
A species planted on a Field tile. Each species has its own growth time and water Demand, and goes through four growth stages before being ready to harvest.
_Avoid_: Plant, vegetable

**Orchard tree**:
A perennial tree placed on owned land that produces one fruit for Harvest, then remains in place and starts another production cycle. Orchard trees need water but do not use Fields or Seed packs; they also provide cooling, biodiversity and wellbeing.

**Seed pack**:
The unit of seeds needed to plant one Field tile, bought with Urbs and kept in the Farm's seed stock. Part of each harvest is converted back into Seed packs.
_Avoid_: Seed (already the game code), grain

**Harvest**:
The player gesture that collects ready Crops by pressing a ready Field's bubble and dragging over the others in one sweep. The yield becomes a Crop Material, stored in the Grain silo; a share of it is converted back into Seed packs.
_Avoid_: Picking, gathering

**Packhouse**:
A building that packs Crop Materials, Cherries, Olive oil, Eggs, Milk and Honey into packed Goods, the only way to sell a Harvest. Several can be built, up to its Build limit; each has its own Tiers.
_Avoid_: Factory, cannery, packing plant

**Livestock farm**:
A Workshop that turns the care of animals into Animal Materials (Eggs, Milk, Wool, Silk). Each animal species is a recipe worked in a Slot; each cycle consumes one Feed: Corn for poultry (hens, ducks), Wheat for ruminants (cows, goats, sheep, alpacas), Mulberry leaves for Silkworms, all taken from the Grain silo. Without Feed in stock the Slot waits. Species unlock by Citizens count, not by Tier. It is not a Farm, which holds the seed stock and produces nothing.
_Avoid_: Farm (already the cultivation entry point), ranch, barn

**Pen**:
A fenced enclosure of the Livestock farm, one more per Tier up to five. A Pen holds the animal of one production of the queue, whether running, waiting for its Slot or waiting to be collected, in the order of the queue; with an empty queue it stays empty.
_Avoid_: Paddock, stall

**Animal Material**:
A Material that comes from living animals or insects, never from killing them. No Good, Material or building of the game is made of meat, hide or any other part of a slaughtered animal.
_Avoid_: Meat, leather, animal product (too generic)

**Hive**:
A perennial placed on owned land that produces Honey for Harvest, then remains in place and starts another production cycle. Like an Orchard tree, it is a free-standing object, independent of the Livestock farm; unlike it, it needs no water and no road, and brings biodiversity and Well-being but no cooling.
_Avoid_: Beehive, apiary

**Dairy**:
A Factory that turns Milk into Cream and Cheese, and sells those Goods itself over its Counter.

**Textile mill**:
A Workshop of the Mill kind that turns Wool, Alpaca wool and Silk into Textile, Alpaca textile and Silk fabric. It has no Counter, since Textile is a Material.

**Knitwear factory**:
A Factory that turns Textile into clothing Goods (Sweater, Gloves, Hat, Alpaca sweater, Scarf), and sells those Goods itself over its Counter.

**Textile**:
The Material a Textile mill makes from Wool. Alpaca wool makes Alpaca textile and Silk makes Silk fabric: a recipe has a single input, so each wool has its own fabric. A Knitwear factory turns them into clothing Goods (Sweater, Gloves and Hat from Textile, Alpaca sweater from Alpaca textile, Scarf from Silk fabric).

**Mulberry tree**:
An Orchard tree whose harvest is Mulberry leaves. The leaves are kept in the Grain silo and serve only as Feed for Silkworms: the Packhouse does not pack them and the Market does not buy them.

**Production building**:
A Workshop, Factory, Mill, Bakery, Dairy, Knitwear factory, Livestock farm or Packhouse: a building that works a queue of items in Slots, faster, wider and richer with each Tier. Selling one is refused when the city's storage could no longer hold what it stores.
_Avoid_: Producer, plant

**Industry building**:
A Production building that employs people and draws on the city's economic activity: every Production building except the Packhouse. A Factory or a Bakery weighs twice a Workshop or a Mill per Tier.
_Avoid_: Industrial building, craft building

**Office building**:
A workplace with Tiers that offers many Jobs and produces only Urbs, in proportion to the Jobs its Commuters fill. The Urbs build up in the building up to a cap set by its Tier and are collected by hand. It uses no Materials or Goods, has no Slots, and is neither a Production building nor an Industry building. Several can be built, up to its Build limit.
_Avoid_: Tertiary building, company, Venue

**Storehouse**:
The general storage that holds Materials and Goods, with a limited capacity. Several can be built, up to its Build limit; each has its own Tiers that raise its capacity, and capacities add up.
_Avoid_: Warehouse, inventory

**Material depot**:
A specialized storage that adds capacity to the Materials compartment only. Several can be built, up to its Build limit; each has its own Tiers.
_Avoid_: Silo (it holds grain: see Grain silo), bin

**Grain silo**:
A specialized storage that holds Crop Materials only, in a compartment of its own that the Storehouse and the Material depot do not share. The Farm provides a small base capacity so the first Harvest is never blocked. Several can be built, up to its Build limit; each has its own Tiers.
_Avoid_: Barn, granary

**Vault**:
A specialized storage that adds capacity to the Goods compartment only. Several can be built, up to its Build limit; each has its own Tiers.
_Avoid_: Cellar

**Home**:
A residential building with eight Tiers (1 to 8) that houses citizens and upgrades by consuming Goods.
_Avoid_: House, residence, dwelling

**Tier**:
The level of an upgradable building (Home, Workshop, Factory, Shop, Storehouse, Power plant, Water tower, Tree, Tall tree, Park). A higher Tier improves the building: a Home houses more Citizens and has a higher Demand; a Workshop or Factory produces faster, gains Slots, yields more per cycle and can produce exclusive Materials or Goods; a Tree or Park reaches farther and gives more cooling, biodiversity and Well-being, without changing its footprint.
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
The satisfaction of a Home's Citizens, raised by nearby Green spaces, Public facility coverage and an active Solidarity reserve, lowered by coal pollution, missing services and Congestion on its Commute. It modulates the Home's Tax.
_Avoid_: Happiness, bonheur, mood, attractiveness

**Mayor**:
The role of the player in the city. The Mayor makes the decisions that the Council votes on.
_Avoid_: Governor, boss

**Council**:
The simulated body of the city that votes on the Mayor's key decisions, such as a new tax, a major construction or a regulation. It does not vote on every building. It is inactive under Cozy Difficulty. It is shown as a circle of seats, with no left and no right, no hemicycle and no ordering of the Factions, so that nothing recalls traditional politics.
_Avoid_: Parliament, senate, assembly, hemicycle

**Approval**:
The standing of the Mayor among the whole city's Citizens. It derives from the Well-being of the Homes and also reacts to the Mayor's decisions. A low Approval only toughens the game gently (smaller Grants, a less cooperative Council); it never touches Tax or Sanctions: it never takes Citizens away and never ends the game. Distinct from Well-being, which is measured per Home.
_Avoid_: Popularity, mood, rating

**Politics window**:
The management view of the city's politics, opened from the selection panel of the Town hall. Its first section is a summary of the current politics (Approval, remaining days of the Term, the Council forecast, active Objectives, open Petitions); the others hold the Council, the Ordinances, the Objectives and the Petitions. It is the only way to act on the politics.
_Avoid_: Politics page, dashboard

**Term**:
The fixed duration, in game days, of a Mayor's mandate. It ends with an Election.
_Avoid_: Mandate, season

**Election**:
The vote at the end of a Term whose outcome is drawn from the game's Seed, so reloading never dodges it. The Approval decides how favourable the next Council is: a Mayor liked by the city faces a balanced Council, a disliked one sees seats move between Factions, and the Council votes with a mandate drawn from the Approval for the whole Term. Easy has no Election. Losing never takes the city from the player.
_Avoid_: Ballot, poll (already used by social features)

**Faction**:
An abstract bloc of the Council with a fixed number of seats, moved by the Election, such as Economy, Environment or Services. It votes on an Ordinance according to its effect on the Faction's concern. It is never a named party or a real person, and it is never placed on a left-right axis.
_Avoid_: Party, group (already Groups)

**Ordinance**:
A city-wide policy the Mayor proposes and the Council votes on, with a cost and an effect, such as the Tax level, a Waste sorting obligation or a Green space quota. A Game object defined by data and unlocked by Citizens thresholds.
_Avoid_: Law, decree, policy

**Objective**:
A target set by the State on existing city measures, such as a Need level satisfaction, a Service coverage or a number of Citizens. A few are active at a time, taken from a catalogue defined by data. Judged on the game clock and replayed by Catch-up.
_Avoid_: Goal (already used by Challenge), quest

**Grant**:
The Urbs paid by the State when an Objective has been held for a period, claimed by hand like Tax. Its amount is modulated by the Approval.
_Avoid_: Subsidy, reward (already used by Challenge)

**Petition**:
A localised message from Citizens naming the cause and the district of a lack of satisfaction, drawn from the existing Need factors. Handling it, by fixing its cause, raises the Approval from Medium Difficulty; on Easy it only informs. Ignored for long enough, it escalates to a Demonstration from Medium.
_Avoid_: Complaint, ticket

**Support**:
The mirror of a Petition: a localised message of Citizens welcoming a good result, drawn from the same factors.
_Avoid_: Applause, like

**Demonstration**:
The escalation of an ignored Petition. It only lowers the Approval and has no other effect.
_Avoid_: Riot, strike

**Need level**:
One of the five stages of the Needs pyramid, from the base up: Vital, Safety, Belonging, Esteem, Fulfilment. Each has a satisfaction from 0 to 100, computed from game data that already exists, weighted by Citizens. The Vital and Safety Need levels also drive the Sanction of a Home; the higher levels only modulate Well-being.
_Avoid_: Maslow level, layer, tier (already Tier)

**Difficulty**:
The setting of a city that decides which Need factors cause a Sanction: Cozy (none, the default, and the one of every city saved before Difficulty existed), Easy (Safety and Health services), Medium (Easy plus Pollution and Congestion), Hard (Medium plus Climate). It can be changed at any time.
_Avoid_: Level (already Tier and Need level), mode

**Sanction**:
The reduction of a Home's Tax caused by its weakest unsatisfied Need factor among those its city's Difficulty makes sanctionable. It grows continuously with the lack of satisfaction, down to a floor of half the Tax, and never takes Citizens away. Computed per Home. Under Hard, Climate sanctions only the Homes without a Green space in reach. The higher Need levels never cause a Sanction: they only add or withdraw a Well-being bonus. Under Cozy there is no Sanction and no warning of one, but a power shortage still lowers the Tax of the Homes it leaves unpowered.
_Avoid_: Penalty (already used for Well-being malus), fine, malus

**Needs pyramid**:
The city management view that shows the five Need levels stacked, each with its satisfaction and the factors that feed it, and a table that explains every factor. A lower Need level that is unsatisfied marks the levels above it as fragile.
_Avoid_: Maslow pyramid, happiness chart

**Worship place**:
A Public facility of the Worship Service category (church, synagogue, mosque, Buddhist temple). Optional like Culture: its absence never lowers Well-being or blocks a Tier upgrade, and different Worship places stack their Well-being. It feeds the Worship factor of the Fulfilment Need level.
_Avoid_: Religious building, temple (one of the four)

**Public facility**:
A building that serves Citizens with a public service in a Service category, at no operating cost except the Waste facilities (Mound, Incinerator, Recycling plant), which charge for the Waste they process. Its Tier raises its Citizen capacity; the Town hall has no Tier.
_Avoid_: Civic building, public service, amenity

**Service category**:
The family of service a Public facility provides: Education, Administration, Culture, Health, Safety or Waste.
_Avoid_: Department, sector

**Service coverage**:
The state of a Home being served by a Public facility of a Service category: within the facility's reach (a square of twice its radius with corners rounded by 3 tiles) and inside its Citizen capacity, nearest Homes first. The Home that crosses the capacity is still served, so a single large Home can always be covered. Some facilities cover the whole city. Missing coverage lowers Well-being and can block Home Tier upgrades.
_Avoid_: Service range, zone

**Transit reach**:
The extension of a Public facility's Service coverage through fast public transport. A Home beyond the facility's reach is still covered when a BRT station, Railway station or Transit hub near the facility is linked, within a maximum travel time, by a Transit itinerary to one near the Home. It applies to every Service category except Waste, uses the same Citizen capacity as direct reach, and Homes in direct reach are served first. Ordinary Bus stops never extend reach.
_Avoid_: Isochrone, bus coverage

**Waste**:
What the Citizens of a Home throw away each day, in proportion to their number. It only matters once the city has about 1000 Citizens; collection is modelled per Home in aggregate, never as rubbish lying in the streets. A Home whose Waste is not processed lacks Waste Service coverage.
_Avoid_: Garbage, trash, rubbish

**Waste coverage**:
The Service coverage of the Waste category. Unlike other categories it also needs a road link: a Home is covered only if a Waste facility reaches it, has capacity left, and is joined to it by the Road network, where a BRT corridor joins the Roads it touches or crosses. A Home reached only by Pedestrian ways is joined when its Pedestrian path network touches a Road linked to the facility within the Carrying distance. When it is not covered, the Home says which cause applies: out of reach, capacity full, or no road link.
_Avoid_: Collection range

**Carrying distance**:
The longest walk, along the Pedestrian path network, between a Home and the nearest Road a Waste facility is linked to. Shorter than a Walking trip to a service. Beyond it the Home is not covered, and within it a Home served this way costs more to collect.
_Avoid_: Walking distance (that is for Walking trips)

**Waste processing**:
The daily handling of Waste by a Waste facility, within its capacity and against a cost in Urbs per unit processed. A facility whose cost cannot be paid stops processing, and its Homes lose their Waste coverage. Facilities are used from the cleanest to the dirtiest: Recycling plant, Incinerator, then Mound.
_Avoid_: Disposal, collection

**Mound**:
A 1×1 Waste facility with three Tiers, the building block of a landfill. One Mound has a small capacity, so absorbing the Waste of a large population takes many Mounds side by side. It emits no Climate emissions, but its odor lowers the Well-being of Homes in its Odor radius.
_Avoid_: Landfill (a landfill is only the player's cluster of Mounds, not an object), dump, heap

**Odor radius**:
The distance around a Mound within which the Well-being of Homes is lowered. Larger than the Mound's collection reach, and never added up: a Home bears the worst of the Mounds around it.
_Avoid_: Smell zone, malus zone

**Incinerator**:
A Waste facility with a large capacity in a small footprint. It burns Waste, which lowers the Well-being of nearby Homes and adds Climate emissions in proportion to the Waste burnt.
_Avoid_: Furnace, burner

**Recycling plant**:
A clean Waste facility that consumes power. It has no Well-being malus, no Odor radius and no Climate emissions, and costs the most per unit of Waste. Its collection reach is the largest of the Waste facilities, larger than the Incinerator's, itself larger than the Mound's.
_Avoid_: Sorting centre

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
The workers of a Venue, held as roles, not as individuals: manager, employee, technician and security in an Arcade; manager, cashier, stocker and security in a Supermarket; manager, receptionist, housekeeper and technician in a Hotel. Each role fills a post of the Venue's Tier (the manager from Tier 2, the technician from Tier 3), is staffed by Citizens like a Job, costs a one-off hiring fee of five days of wages, then a daily wage in Urbs.
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

**Rank**:
The standing of a Venue, from 1 to 3, earned by the net Urbs it has made since it opened. It never costs Urbs and is kept through upgrades. The strongest Fixtures need a Rank as well as a Tier, and events open at Rank 2.
_Avoid_: Level, Tier, Standing, Reputation

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
The daily journey of a Home's Citizens who do not use public transport, from the Home to the workplaces (Workshop, Factory, Office building, Shop, Public facility, Leisure building) by the shortest road path. Commuters fill the nearest workplaces first, up to their Jobs; those who find none do not drive, and those whose workplace is within walking distance walk instead of driving. Modelled per Home in aggregate, never per individual Citizen.
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
The route on foot between a Building and a destination, over the sidewalks of roads and built Pedestrian ways. Sidewalks are implicit on every Road tile and have two sides; a road is crossed only at a Crossing or around a dead end. Its length counts tiles walked plus a cost per Crossing crossed.
_Avoid_: Footpath, pavement

**Pedestrian way**:
A player-built tile reserved for pedestrian traffic, connected to other Pedestrian ways and to a Road sidewalk at its endpoint. It cannot be used by Vehicles and has no pedestrian capacity limit.
_Avoid_: Footpath, pedestrian-only street

**Sidewalk side**:
One of the two edges of a Road tile along which Citizens walk. The two sides of a straight tile are joined only by a Crossing.
_Avoid_: Pavement, kerb

**Walking trip**:
A trip on foot from a Home to a shop, school, health, culture, casino, park or Town hall within walking distance. It adds no car demand, gives Well-being, and loads the Crossings it uses. Modelled per Home in aggregate.
_Avoid_: Stroll, individual journey

**Cyclist Rider**:
A Rider who reaches a BRT station, Railway station or Transit hub by bicycle from beyond walking range, up to three times the stop coverage distance, and takes the bicycle aboard. Bicycles are carried by BRT vehicles and Trains but not by ordinary buses, so a Cyclist Rider's Transit itinerary has no bus leg. A Cyclist Rider takes two places on each line used instead of one.
_Avoid_: Bike sharing, bike parking

**Cycling trip**:
A trip by bicycle from a Home to the same destinations as a Walking trip, within a cycling distance of three times the walking distance. It replaces the Walking trip when the destination is out of walking range, never adds to it. It travels over the Pedestrian path network, so Sidewalks and Pedestrian ways are also cycleways. It needs no purchase and no dedicated infrastructure, adds no car demand, gives Well-being, and loads the Crossings it uses. Modelled per Home in aggregate.
_Avoid_: Bike lane, bike sharing, individual journey

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

**Analytics view**:
A read-only view of the city reached from the Land menu, in which the map is drawn through one Layer at a time. It never changes the city, is never saved and adds no simulation: every Layer projects figures the city already computes, except Land value.
_Avoid_: Heatmap, overlay, dashboard

**Layer**:
One reading of the city shown in the Analytics view. A Movement layer or a Data layer.

**Movement layer**:
A Layer showing how much Commuters or Pedestrians load the Roads and Sidewalks, as a share of capacity or as a volume: Pedestrians, Cars or All. It shows the city's aggregate load, never individual Vehicles or Pedestrians.
_Avoid_: Flow layer (Flow factor is a hydro term), traffic animation

**Data layer**:
A Layer showing a measure of the city over the map: Service coverage of one Service category, Well-being, Pollution, Congestion, Odor radius or Land value. Pollution, Odor, Congestion and Land value are read at every tile; Well-being and Service coverage are read per Home.

**Land value**:
A read-only indicator of how desirable a tile is: higher near Green spaces, Public facilities, Leisure buildings and Road or public transport access, lower near Pollution, Odor and Congestion. It has no effect on Parcel prices, Tax or Well-being.
_Avoid_: Price, rent

**Diagnosis**:
The short ranked list of Causes the game gives for a state of the city, such as why the roads jam or why Homes lack Waste coverage. It is derived from the figures the simulation already computes, in plain rules, never from a free-text generator. Shown at most three Causes at a time, heaviest first, and nothing when the city is fine.
_Avoid_: Advice, analysis, report

**Cause**:
One entry of a Diagnosis: a statement with its figures, a weight (the share of the city's Citizens it hurts) and, when it has a place, a spot on the map to show. A Cause is not a Sanction, a Petition or a Need.
_Avoid_: Reason, problem

**Power plant**:
A building that supplies power to the city, using wind, water, the heat of the ground or coal. The code name `powerPlant` is the wind one; the others have their own names. Backup generation is a separate service role.
_Avoid_: Generator, energy station

**Coal Power plant**:
A polluting Power plant that supplies stable power from coal and reduces nearby Citizen well-being. It allows the player to power an entire city with coal.
_Avoid_: Wind turbine, Factory

**Hydro power plant**:
A clean Power plant built on land touching a Water tile. Its Capacity is scaled by its Flow factor and varies slowly over the day. It costs nothing to run and pollutes nothing.
_Avoid_: Dam, watermill, Wind turbine

**Flow factor**:
The share of a Hydro power plant's Capacity that its water supplies: the Water tiles connected to it divided by 8, at most 1. Without a connected Water tile it is 0.
_Avoid_: Water level, Demand (that is the city's need for water)

**Geothermal power plant**:
A clean Power plant that supplies the same Capacity around the clock whatever the weather or the hour. It is the only constant renewable source, paid for by a late unlock, a high price and a Build limit. It costs nothing to run and pollutes nothing.
_Avoid_: Heat pump, boiler, Coal Power plant

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
A structure carrying a Road or a BRT corridor over an obstacle. A Bridge over Water is a single span of fixed length (1, 2, 3 or 5 tiles), from one bank to the other, aligned with a Road or Crossing at each end; Boats cannot be placed on it but still navigate beneath it, and it opens for them: see Bridge opening. A Bridge over infrastructure has three mandatory parts, a rising Bridge ramp, a Bridge span (1, 2, 3 or 5 tiles) and a descending Bridge ramp, and carries one network, its Carrier. Either kind joins the graph of its Carrier.
_Avoid_: Viaduct, overpass

**Bridge span**:
The raised part of a Bridge over infrastructure, whose tiles pass above at least one Road, BRT corridor or Railway tile, the other tiles being free land. Nothing but infrastructure and free land may lie under it, and no Bridge lies under another.

**Bridge ramp**:
The one-tile slope at each end of a Bridge over infrastructure, lifting the Carrier up to the Bridge span and bringing it back down. It stands on free land and is aligned at its outer end with a tile of the Carrier's network.

**Carrier**:
The network a Bridge over infrastructure carries: the Road or the BRT corridor. A Railway is never a Carrier.

**Bridge opening**:
The raising of a Bridge in two leaves when a Boat has to pass beneath it, each leaf hinged on its bank (a 1-tile Bridge has one leaf; 3 tiles give 2 + 1, 5 tiles give 3 + 2). Traffic stops before it, like at a red light. Its cost is a closed fraction of time, from the Boats that can reach the Bridge, which lowers the capacity of its Road tiles.
_Avoid_: Lift, swing, drawbridge cycle

**Market**:
The simulated (non-player) buyer that purchases Goods from the player.
_Avoid_: Trade hub, exchange, auction

**Donation**:
A voluntary gift of Goods to a simulated association, with no Urbs received in exchange, that fills the city's Solidarity reserve and counts towards a permanent Medal.
_Avoid_: Trade offer (a gift to a Friend), sale

**Solidarity reserve**:
A capped reserve filled by Donations that gradually depletes and temporarily raises Well-being across the city. Further Donations refill the same reserve rather than stacking bonuses.
_Avoid_: Donation stock (the Goods have been given away), permanent bonus

**Slot**:
A position in a building's production queue (or a Shop's sales stack). A building has 2 to 5 Slots; extra Slots are bought with Urbs.
_Avoid_: Lane, tray

**Rush**:
The purchase, with Urbs, that immediately completes the production running in a Slot of a Workshop, Factory or Packhouse. Its price rises with the value of the item and falls as the remaining time shrinks, never reaching zero. The result is the same as a natural completion, and the next waiting Slot starts at once. Labelled "Finaliser" in French.
_Avoid_: Skip, Boost, Speed-up, Instant build

**Tax**:
Urbs produced over time by the citizens of a Home, collected by hand.
_Avoid_: Rent, income

**Parcel**:
A 16x16 tile square of land; the player owns some and can buy adjacent ones with Urbs. Buildings must fit entirely inside owned Parcels.
_Avoid_: Plot, lot, zone, sector

**Wild land**:
The land of the map outside the Parcels the player owns, and the scenery around the map. Nothing can be built on it; it becomes buildable only when the Parcel covering it is bought.
_Avoid_: Unclaimed land (claim is a Trade offer word), unowned parcel, wasteland

**Catch-up**:
The single pass that applies everything that happened since the last time the game was open, up to 48 game hours.
_Avoid_: Offline progress, sync

**Unlock**:
The moment a Material, Good or building becomes available, triggered when the city's total Citizens reach a set threshold.
_Avoid_: Level up, tech tree, research

**Tutorial**:
The guided sequence of steps played at the start of a new game, where the player places the first buildings to lay a solid base. It can be skipped at any time.
_Avoid_: Onboarding, intro, walkthrough

**Venue tutorial**:
The short guided sequence started when the first Venue of a type is placed, teaching the player to make it earn. It never locks commands and can be skipped or replayed. Distinct from the Tutorial.
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

**Solar panels**:
A paid improvement, independent of Tier, that equips an eligible building with panels so it produces power from daylight. A Home can be built with them (a Solar Home) or retrofitted; any other eligible building can only be retrofitted. Public facilities of the Education, Administration, Culture, Health, Safety and Worship categories are eligible (not Waste facilities nor the Ferris wheel and Roller coaster). A building is eligible when its definition declares Solar panels. Its price, unlock threshold, output and the placement of the panels on its roof are set per building definition. On a Home the panels are part of its solar models; on any other building they are a generic roof overlay, so its color and Repaint are unaffected.
_Avoid_: Solar Home (that is a Home built with them), Solar installation, Solar upgrade

**Mansard Home**:
A Home sold in three fixed footprints (1×1, 1×2, 2×2) whose five Tiers each add a floor, available in three colors and with solar panels. It shares the population and utility Demand of the first five Tiers of a Home.
_Avoid_: Mansard house, attic home

**Insulation**:
A paid Home improvement that reduces power Demand independently of solar equipment.
_Avoid_: Energy generation, Home Tier

**Repaint**:
A paid improvement that changes the color of a Home, a shop, a Venue (Arcade, Supermarket or Hotel), the Baseball field or a production, storage or utility building to another of its available colors. Every repaintable building is drawn in four colors, the default and three others, as four tones of one model: Repaint swaps its palette. A building whose models were later redrawn keeps loading with the color it was saved with, which the game then ignores if its models no longer offer it. Solar installations, batteries, Backup Power plants and Facilities are not repainted. Its price depends only on the building's Tier, never on the color chosen, and a building cannot be repainted to the color it already has.
_Avoid_: Recolor (that is a Model definition field), Color change

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

**Stop name**:
A name the player gives to a Bus stop, BRT station, Railway station or Transit hub. It replaces the default designation of the stop wherever the stop is shown, and goes away with the stop. Without one, the stop keeps its default designation.
_Avoid_: Label, Title

**Bus line**:
An ordered set of road-connected Bus stops, with operating costs and usage driven by useful residential and activity coverage. An active Bus line drives on the ordinary roads like any other Vehicle: it loads them and is slowed by their Congestion, which lowers its Effective speed and capacity.
_Avoid_: Individual Citizen journey, decorative Traffic

**Loop line**:
A transport line of any mode (Bus line, BRT line or Railway line) whose last stop is followed by its first, so its vehicles circulate in one direction only. It needs at least three stops, and the closing section back to the first stop must be connected like any other.
_Avoid_: Circular route, return trip

**Effective speed**:
The speed of a Bus line once the Congestion of its route is counted: each tile of the route takes longer in proportion to how far its section is above capacity, down to half of the nominal speed. Capacity and itinerary times follow it. BRT and rail are never slowed.
_Avoid_: Delay, journey time

**Adaptation period**:
The announced grace period during which new electricity shortages or newly required Service coverage do not penalize production, Tax or Well-being.
_Avoid_: Permanent exemption, free energy

**BRT corridor**:
A dedicated infrastructure for bus rapid transit, separate from the ordinary road network. A crossing with a Road does not connect the two networks, except for Waste coverage.
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

**Transport map**:
A read-only schematic of the public transport network in City management: stops and Transit hubs as nodes, Bus, BRT and Railway lines as coloured strokes, and the possible Transfers between stops. The thickness and colour of a line follow its load, and the map can be filtered by mode. It shows the network and its volumes per line, not the car, walking and cycling flows, which stay in Traffic.
_Avoid_: Network editor, road map, minimap

**Transit hub**:
A multimodal station that serves as a stop for every public transport network it touches among the Road, the BRT corridor and the Railway, and is reached on foot from the Pedestrian ways and Sidewalks it touches. It is valid as soon as it touches one of these four networks, and is inactive while it touches no vehicle network. Lines of different modes can use it as a stop, and a Transfer between lines that share it needs no walking distance.
_Avoid_: Interchange, terminal, Bus stop

**Access mode**:
A network a building can be reached from: the Road, the BRT corridor or the Railway. Each building declares the modes it accepts. Homes, Leisure buildings, Shops and Public facilities accept both; every other building accepts the Road only. A position is valid when any accepted mode has a tile in front of the building.
_Avoid_: Entrance, connection type, requiresRoad

**Front**:
The side of a building turned towards its access. A building has one Front among its four sides. A side is a valid Front when it touches at least one accepted Access mode. A building touching several Roads (a corner, up to four) therefore has several valid Fronts; the player picks among them, and the Road side wins over a BRT side by default.
_Avoid_: Facade, entrance, orientation

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
The copy of the city kept online for a Player account: the current one plus the 9 previous versions. The local save stays the source of truth; the Cloud save mirrors it.
_Avoid_: Remote save, sync, server save

**Save conflict**:
The situation where the local save and the Cloud save have both advanced since they last matched. The player chooses which one to keep; the other is kept as a previous version.
_Avoid_: Merge, overwrite

**Handle**:
The unique public name of a Player account in multiplayer, the only identity shown to other players. It is required to enter multiplayer, which also requires an attached email. The email is never shown.
_Avoid_: Username, nickname, pseudo

**Avatar**:
The picture of a character chosen by a Player account from a closed set of twelve, shown next to its Handle everywhere the Handle appears. It is optional and can be changed at any time; an account without one shows a default Avatar derived from its identity.
_Avoid_: Portrait, profile picture, icon

**Friend request**:
An invitation from one Player account to another, found by exact email, that the other accepts or ignores. Searching an email never reveals whether an account exists.
_Avoid_: Follow, invite

**Friend**:
A Player account linked to another by an accepted Friend request. The link is mutual and either side can end it.
_Avoid_: Contact, buddy

**Block**:
A player's choice to hide themselves from another Player account: they no longer appear in that account's searches and its Friend requests are silently refused.
_Avoid_: Ban, mute

**Message**:
A short plain-text note, 500 characters at most, that a Friend sends to another in their Conversation. Messages older than 30 days disappear.
_Avoid_: Chat line, DM

**Conversation**:
The exchange of Messages between two Friends. It ends, with all its Messages, when the Friendship ends or one side blocks the other.
_Avoid_: Thread, channel

**Group**:
A named room of Friends of its creator, where its members exchange Group messages. The creator names it, can rename it, and is the only one who adds members, from their own Friends; an added Friend is a member at once and can leave at any time. The creator can remove a member or delete the Group with all its Messages, and cannot leave without deleting it. A member who stops being a Friend of the creator (Friendship ended or Block, in either direction) is removed. Members of a Group are not Friends of each other; a Block between two members hides the blocked one's Group messages from the blocker. There is no invitation link.
_Avoid_: Channel, room, chat, guild

**Group message**:
A short plain-text note posted in a Group and visible to all its members, under the same limits as a Message (500 characters, 30 days, shared daily sending cap).
_Avoid_: Post, broadcast

**Trade offer**:
A Lot of Materials and/or Goods that one Friend proposes to another, for a price in Urbs set by the sender (0 for a gift). The recipient accepts or refuses; an offer left open expires after 72 hours. Seed packs, buildings and bare Urbs cannot be offered.
_Avoid_: Deal, auction, barter

**Lot**:
The Materials and Goods of a Trade offer: up to ten lines, one item each, with a quantity.
_Avoid_: Bundle, parcel, cargo

**Escrow**:
The hold the server keeps on a lot or a payment between the creation of a Trade offer and its claim, so that each side claims once and a refused or expired offer returns everything to its owner. The server does not check that the lot ever existed in the sender's city.
_Avoid_: Deposit, lock

**Challenge**:
A goal published by the server to all Player accounts: deliver a list of Materials and Goods (several kinds, each with a quantity) to the Challenge stock before a deadline. A Challenge is either a Daily challenge or an Event. Accepting one is optional; a player has at most one accepted Challenge at a time. The player can abandon the accepted Challenge: it is closed for good, the Challenge stock is lost and it cannot be accepted again, so the player waits for the next one.
_Avoid_: Quest, mission, task

**Challenge name**:
The title of a Challenge, shown in the player's language. A Daily challenge's name is generated from a hook phrase and its main item, picked by keys the server stores, so the same Challenge reads the same for everyone in a given language. An Event can carry a hand-written name, translated FR/EN; the generated name is only its fallback.
_Avoid_: Title, label

**Daily challenge**:
A Challenge renewed every day at 07:00 Paris time by the server, paid in Urbs, published in three variants (easy, medium, hard), with a goal reachable in about 45 minutes of active play.
_Avoid_: Daily quest

**Event**:
A Challenge with a start and an end date set by the server, longer than a day, paid in Medals. Distinct from an Annual event, which is calendar-based and involves no server.
_Avoid_: Festival

**Annual event**:
A yearly occasion (Halloween, Winter holidays, Easter, Midsummer, or one of the four seasons) tied to a date of the calendar, during which its Annual event items can be built. The date it is anchored on, in the northern hemisphere, is the same every year, except Easter and Midsummer, which move.
_Avoid_: Season (for the occasion in general), festival, seasonal event

**Annual event window**:
The period during which an Annual event is active: from 21 days before its anchor date to 14 days after it, both days included, judged on the date of the player's device. Windows of different Annual events may overlap.
_Avoid_: Period, duration

**Annual event item**:
A Building that belongs to an Annual event, sold at a high price in Urbs and purely cosmetic. It can only be newly built during its Annual event window; those already placed stay in the city for good, with no end date.
_Avoid_: Seasonal item, limited item

**Challenge stock**:
The units the player has set aside for an accepted Challenge, taken from the Storehouse at any time before the deadline, from any source (production, purchase, Trade offer). They are consumed: kept by the Challenge whether it succeeds or fails, and never returned.
_Avoid_: Basket, deposit, contribution

**Medal**:
A permanent distinction earned by completing a Challenge whose reward is a Medal, or by reaching cumulative Donation value milestones. It is shown in the Social window, on the Player account's own profile and on its Friends'.
_Avoid_: Badge (reserved for the notification counter on a button), trophy, achievement

**Hall of fame**:
The public ranking of the ten biggest cities by Citizens, one per Player account that has a Handle and has not opted out. Each entry shows the Avatar, the Handle and the Citizens count of its city. Anyone can consult it.
_Avoid_: Leaderboard, top 10, scoreboard

**Showcase**:
The copy of a Player account's city that other players can Visit. It is kept separate from the Cloud save, which stays private, and is replaced whenever the city is saved online. A Player account that opts out has no Showcase and is absent from the Hall of fame.
_Avoid_: Public save, snapshot, preview

**Visit**:
Looking around another Player account's Showcase in the game, read-only: nothing advances, nothing can be built or changed, and the visitor's own city and saves are never touched. Anyone can Visit, including a Player account without email.
_Avoid_: Spectate, preview, load

**Back office**:
The local tool, never deployed, with which an Admin lists Player accounts, moderates them and inspects their Cloud saves. It runs only on the Admin's machine and acts with the service key of the Supabase project it is pointed at.
_Avoid_: Admin panel, dashboard, console

**Admin**:
The person who runs the Back office. Not a Player account and never visible to players.
_Avoid_: Moderator, operator

**Command gateway**:
The single module that applies a Command to the live game and owns all its consequences: the read-only guard, the toast of an error or an event, the effects bound to an event type (harvest, Casino rounds), the end-of-Tutorial notice, the undo of a deletion and the replacement of the game state. The player, a Trade and a Challenge all reach the game through it.
_Avoid_: Dispatcher, command bus, game service

**Codex**:
The in-game reference window: one entry per Building, road, water construction and Crop, with its levels, plus rule pages on the game's systems. Some of its figures reflect the current city.
_Avoid_: Encyclopedia, wiki, help

**Guide**:
The public website, readable without playing, that presents every Codex entry and page and explains the game's mechanics. Its figures come from the game's definitions, never from a player's city.
_Avoid_: Docs, documentation, manual, wiki

## Relationships

- Politics (Council, Approval, Objectives, Grants, Petitions) exists only once a Town hall is built and only from Easy Difficulty. Under Cozy there is none, and cities saved before it stay untouched.
- The outcome of a Council vote is deterministic and forecast by Faction before the Ordinance is proposed: there is no luck and no buying of votes. A rejected Ordinance can be proposed again after a delay.
- Only the adoption of an Ordinance goes through the Council. The Mayor repeals it freely, without a vote, at a small loss of Approval if it was popular. An adopted Ordinance costs a daily upkeep in Urbs.
- A Codex page, linked from the Town hall panel like the Waste page is from Waste facilities, details every rule of the politics. The Politics window summarises the current state and links to that page; it does not repeat the rules.
- A Grant is fixed on Easy and Medium and modulated by the Approval on Hard only.
- The Approval stays between 0 and 100. Each game day it moves toward the Citizen-weighted mean Well-being; the Mayor's decisions (an Ordinance adopted or repealed, a Petition handled, a Demonstration) add one-off shocks that fade.
- The politics of a city is saved as its own block, absent in cities saved before it. Its draws (the Election, the generation of Petitions) use their own stream of the game's Seed.
- Time skip and Catch-up replay the politics in full: Petitions escalate, Elections take place, Objectives are judged, and a summary is shown on return. An Adaptation period follows its first activation, with no Demonstration and no Approval penalty.
- The launch Ordinances rest on existing systems only: Tax level (3 levels), Waste sorting, Green belt, subsidised public transit, energy saving, Office relief, Cultural festival. The launch Objectives are a Vital Need level threshold, full Waste coverage, Congestion under a threshold, a Green space share and Citizens milestones.
- From Easy Difficulty: Council, Ordinances, Objectives and Grants, with Petitions and Support informative only. From Medium: Demonstrations and the Election. On Hard the Approval also weighs on the Grants and on the Council's goodwill.
- A Command from the player, a Trade or a Challenge reaches the game through the Command gateway: the same read-only guard, toasts and event effects. Only the player's Commands keep a deletion undo.
- A Trade offer can only be accepted if the recipient's Storehouse compartment has room for the lot and their Urbs cover the price.
- Blocking a Friend closes their conversation and returns any open Trade offer between them.
- A Cloud save never replaces the local save without the player's consent when a Save conflict exists.
- A Daily challenge pays twice the sum of the values of the items of its goal in Urbs, only if the Challenge stock is complete before the deadline (judged by the server clock, online); otherwise the stock is lost.
- While a Challenge is accepted and unfinished, a Time skip is refused. Catch-up still applies.
- A Casino is a Leisure building, never a Public facility.
- A Venue is distinct from a Casino and a Shop: Minigames and Stakes belong to the Casino only.
- A breakdown of a Fixture is drawn from the Venue's own stream of the game's Seed, so reloading never dodges it.
- A Venue is simulated in aggregate per game tick, collected by hand like Tax, and replayed by Catch-up.
- A Pleasure boat is a Leisure building and a Casino boat is a Casino, both hosted by a Boat on a Water tile.
- Removing a Water tile that carries a Boat or a Bridge, a Marina that holds Boats, or a Water tile that would cut a Boat off its Marina is refused.
- A Bridge is part of the graph of its Carrier: Commute, Congestion and Pedestrian paths use a Road Bridge like any Road. Bridge openings lower the capacity of a Bridge over Water in proportion to the Boats that can reach it.
- A Bridge over infrastructure does not connect to the networks beneath it. It has no side exit, no stop, station, Crossing or building access on its span or ramps, and its Sidewalks join those of the Road that extends it.
- A Road Bridge over infrastructure has one Road tier for its three parts, starting at the lower tier of its two ends, upgraded as a whole and capped like a Road. A BRT Bridge has no tier.
- Demolishing the last infrastructure tile under a Bridge span is refused. A new network may be built under an existing Bridge span only across it.
- A Pedestrian way joins the Pedestrian path network but not the Road or BRT networks. Homes, Schools, Shops and the Town hall can use it as their only access; other buildings still require their existing access modes.
- A Pedestrian path uses the shortest route through the combined Sidewalk and Pedestrian way network. It crosses Roads only at a Crossing or around a dead end, and only the Crossings it uses reduce Road capacity.
- A building touching both a Road and a BRT corridor keeps the Road as its primary access, and its front faces the Road.
- Removing the last access of a building, Road or BRT corridor, is refused.
- Service vehicles stay on the network of their facility and never switch between Road and BRT corridor.
- Waste is a Service category: missing Waste coverage lowers Well-being, can block Home Tier upgrades, feeds the Vital Need level and is sanctioned from Easy Difficulty. A city already past 1000 Citizens gets an Adaptation period before Waste counts.
- A Mound works if it or a Mound adjacent to it touches a Road, or if their group touches a Pedestrian path network that reaches a Road. Incinerator and Recycling plant need their own Road.
- A Mound has two distances: the collection reach, like any Public facility, and the larger Odor radius.
- A Casino is shed first when electricity falls short, before Homes, except during an Adaptation period. A Casino boat is never shed: it uses no power.
- A Minigame round of chance draws from the game's Seed; its outcome is fixed when the Stake is debited.
- A blockmatch round pays by stars on top of the returned Stake: none loses the Stake, 1 star wins 25% of it, 2 stars 50%, 3 stars 100%.

- The "Annual events" build section is shown only while at least one Annual event window is open, and groups its Annual event items by Annual event. The player can dismiss the notice of an Annual event once per year.
- An Annual event item has no Citizens threshold, no Build limit and no Escalating price, and it is never Retired when its window closes.

## Naming rules

- Common words are kept for Materials and Goods; invention is reserved for brand-like terms (game name, currency, market).
- No trademarked terms from other games in code, docs or UI.
- Code identifiers and this glossary are in English; UI strings are translated FR/EN. The game name and the currency name are identical in both languages.
