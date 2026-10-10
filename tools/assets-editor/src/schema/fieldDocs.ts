export interface FieldDoc {
  description: string
  usedBy: string
}

const d = (description: string, usedBy: string): FieldDoc => ({ description, usedBy })

// What each property means and where the game reads it. A key may be narrowed to a scope (a kind of building, a collection or a settings file) as `scope.key`; the unscoped entry is the fallback.
const DOCS: Record<string, FieldDoc> = {
  // Shared by every Game object
  kind: d('The family of rules in code the object follows.', 'Chooses the fields of this form and the rules the game applies to the object.'),
  retired: d('A retired object can no longer be built or unlocked, but cities that already have it keep it.', 'Build menu, saves.'),
  name: d('The name shown to players, in English and French.', 'Build menu, codex, events, information panels.'),
  description: d('The codex text. It is an ICU MessageFormat template: placeholders such as {cost} are replaced by the object’s values.', 'Codex.'),
  model: d('The Model id of the 3D model that represents the object.', 'The scene, the preview, and the icons generated from it.'),
  models: d('The Model ids of the 3D models that represent the object.', 'The scene and the preview.'),
  footprint: d('The tiles it covers, width × depth.', 'Placement, collisions, road access and drawing.'),
  section: d('The build menu section where the building is offered.', 'Build menu.'),
  cost: d('What it costs in Urbs to build.', 'Placement; a share is refunded when it is sold.'),
  unlockCitizens: d('How many Citizens the city needs before it is available.', 'Build menu lock, “item locked” errors, unlock events, codex.'),
  requiresRoad: d('Whether it must be next to a road.', 'Placement validity and road access.'),
  accessModes: d('The networks that give it access: road, BRT.', 'Placement validity and transit stops.'),
  goodCategory: d('The Good category the Shop sells; “all” sells every category.', 'Which Goods a Shop can stock, and the General shop.'),
  slotPriceFactor: d('Multiplies the price of every extra Slot of the Shop.', 'Buying Slots in the General shop.'),
  sells: d('The Goods the Shop sells at this Tier, by Good id. Packed Crops are added by the Food category.', 'Stocking the Shop and the Shop panel.'),
  saleIntervalFactor: d('Multiplies the time between two sales of a stack: below 1 sells faster.', 'Shop sales.'),
  jobs: d('How many Jobs the building offers at this Tier.', 'The Commute and Citizen workplaces.'),
  'shop.maxSlots': d('How many Slots the Shop can hold at this Tier.', 'Buying Slots in a Shop.'),
  initialSlots: d('How many Slots a new building starts with.', 'Shops and workshops when they are built.'),
  tiers: d('Its levels. Each Tier inherits what it leaves out from the previous one.', 'Upgrades, the preview, the codex levels, and every rule that reads a value per Tier.'),
  variants: d('Visual alternatives of the first Tiers, with no effect on rules.', 'The scene (for instance a Home with solar panels).'),
  upgradeCost: d('What it costs in Urbs and Goods to reach this Tier.', 'The upgrade command and the upgrade panel.'),
  urbs: d('Urbs to pay.', 'The upgrade command.'),
  goods: d('Goods to hand over, by Good id and quantity.', 'The upgrade command, taken from the city’s stored Goods.'),
  'storage.goods': d('Goods this Tier adds to the capacity of the Goods compartment.', 'The city’s storage limits, summed over its storage buildings.'),
  family: d('The family it belongs to, which sets its rules.', 'Nature: cost, unlock, radius and benefits. Boats: how it is used.'),
  'boats.family': d('The kind of Boat: pleasure, fishing or casino.', 'What the Boat does and which Marina rules apply; saved Boats keep only this.'),

  // Homes
  citizens: d('How many Citizens live here at this Tier.', 'Population, taxes, demand.'),
  power: d('Power it demands.', 'The power balance of the city.'),
  water: d('Water it demands.', 'The water balance of the city.'),
  'facility.power': d('Power the facility demands.', 'The power balance of the city.'),
  'facility.water': d('Water the facility demands.', 'The water balance of the city.'),
  'transitVehicles.power': d('Power Demand while the vehicle runs.', 'The power balance of the city.'),
  'crops.water': d('Water the Crop needs.', 'Farming.'),

  // Production, farm, storage
  durationFactor: d('Multiplier on the crafting time of recipes.', 'Workshop, Factory and Packhouse production.'),
  maxSlots: d('How many Slots it holds at this Tier.', 'Production queues.'),
  'production.yield': d('Units made per crafting cycle.', 'Production output.'),
  seedCapacity: d('How many seeds the Farm can hold.', 'Farming.'),
  fieldCap: d('How many Field tiles the Farm allows.', 'Field placement.'),
  materials: d('Capacity this Tier adds to the Materials compartment.', 'The city’s storage limits, summed over its storage buildings.'),
  crops: d('Capacity this Tier adds to the Crops compartment.', 'The city’s storage limits, summed over its storage buildings.'),

  // Utilities
  capacity: d('What this Tier supplies: power or water for utilities, Citizens served for facilities.', 'The power and water balances; coverage of Public facilities.'),
  'facility.capacity': d('How many Citizens the facility serves at this Tier. Left out, it serves everyone.', 'Service coverage and the codex.'),
  'transitStop.capacity': d('Passengers a vehicle of this network carries.', 'Line capacity.'),
  output: d('Power produced at full daylight.', 'The power balance of the city.'),
  storage: d('How much surplus the battery can hold.', 'The power balance of the city.'),
  rate: d('How much the battery can feed per hour.', 'The power balance of the city.'),
  costPerUnit: d('Urbs per unit of power supplied.', 'Operating cost of the Backup Power plant.'),

  // Public facilities, sport, casino
  category: d('The Service category the facility provides.', 'Service coverage and the Home Tiers that require it.'),
  'goods.category': d('The Good category the Good belongs to. A Shop sells only the Goods of its own category.', 'Shops; crop packs are always Food.'),
  'fixtures.category': d('The section of the Venue build menu where the Fixture is offered.', 'The Venue build menu.'),
  detailModel: d('The awning, overhang or parasol set over the entrance.', 'The scene.'),
  unique: d('Only one can be built in a city.', 'Placement.'),
  radius: d('How far it reaches, in tiles from its center; the reach is a square of twice this size.', 'Coverage, Well-being and the codex.'),
  wellbeingBonus: d('Well-being it gives to the Homes it reaches.', 'Citizen Well-being.'),
  stakeSteps: d('The Stake values a player can choose.', 'The Casino Minigames.'),
  gameMinTier: d('The Tier at which each Minigame opens.', 'The Casino Minigames and the codex.'),
  maxStake: d('The highest Stake allowed at this Tier.', 'The Casino Minigames.'),
  blockmatchLevel: d('The difficulty level of the blockmatch Minigame at this Tier.', 'The blockmatch Minigame.'),
  slotMachine: d('Tier at which the slot machine opens.', 'The Casino Minigames.'),
  blackjack: d('Tier at which blackjack opens.', 'The Casino Minigames.'),
  blockmatch: d('Tier at which blockmatch opens.', 'The Casino Minigames.'),

  // Venues
  rankAt: d('Net Urbs earned since opening to reach Rank 2 and Rank 3.', 'Venue Rank, which unlocks Fixtures and events.'),
  staffRoles: d('The Staff roles the Venue can hire.', 'The Staff panel.'),
  frontRole: d('The role that serves the front desk.', 'The rate at which visitors are served.'),
  fixtureCategories: d('The sections of the Venue’s Fixture menu, in order.', 'The Venue build menu.'),
  shell: d('The models of the interior: floor, wall and corner, and where the corner stands.', 'The Venue interior.'),
  floor: d('Model of the floor tile.', 'The Venue interior.'),
  wall: d('Model of the wall piece.', 'The Venue interior.'),
  'venue.corner': d('Model of the wall corner.', 'The Venue interior.'),
  cornerX: d('Offset of the corner piece along X.', 'The Venue interior.'),
  cornerZ: d('Offset of the corner piece along Z.', 'The Venue interior.'),
  cornerRotation: d('Rotation of the corner piece, in degrees.', 'The Venue interior.'),
  staffModels: d('The characters shown as Staff.', 'The Venue crowd.'),
  gridSize: d('Side of the interior grid at this Tier.', 'Fixture placement.'),
  takingsCap: d('The most Takings the Venue holds before it is emptied.', 'Venue Takings.'),
  eventBudget: d('What a Venue can spend on an event at this Tier.', 'Venue events.'),
  eventMultiplier: d('Multiplier on earnings while an event runs.', 'Venue events and Takings.'),
  posts: d('How many people of each role can be hired at this Tier.', 'The Staff panel and wages.'),

  // Marina and transit
  boats: d('How many Boats this Tier moors.', 'Boat purchase and the codex.'),
  mode: d('The transit mode: bus, BRT or rail.', 'Lines, vehicles and the network rules.'),
  network: d('What the BRT or rail network costs, how fast it runs and what a vehicle carries.', 'Network building and line capacity.'),
  tileCost: d('Urbs per tile of network.', 'Building a BRT corridor or railway.'),
  speed: d('Tiles per hour a vehicle runs at.', 'Line cycle time and capacity.'),

  // Fixtures
  venue: d('The Venue the Fixture belongs to.', 'The Venue’s build menu and rules.'),
  price: d('Urbs to place the Fixture; a share is refunded when it is removed.', 'The Venue build menu.'),
  'transitVehicles.price': d('Urbs to buy the vehicle.', 'The fleet purchase panel; half is refunded when it is sold.'),
  minTier: d('The Tier the Venue, Workshop or Factory must have reached.', 'Availability in menus and recipes.'),
  minRank: d('The Rank the Venue must have reached.', 'The Venue build menu and events.'),
  wear: d('Share of the wear its use causes; 1 when left out.', 'Venue wear.'),
  tint: d('Colour applied to the model.', 'The Venue interior.'),
  loud: d('Whether it makes noise.', 'Venue ambience.'),
  partition: d('A wall only divides the room: it earns, serves and wears nothing.', 'Venue layout.'),
  attract: d('Attractiveness a decoration adds.', 'Visitors of the Venue.'),
  playsPerHour: d('How many plays an arcade game serves per hour.', 'Arcade earnings.'),
  shelf: d('Units a shelf holds.', 'Supermarket stock.'),
  checkout: d('Shoppers a checkout serves per hour.', 'Supermarket sales.'),
  reception: d('Marks the reception desk.', 'Hotel check-in.'),
  sleeps: d('Guests a bed sleeps.', 'Hotel capacity.'),
  bath: d('Rooms a bathroom piece serves.', 'Hotel capacity.'),
  comfort: d('Comfort points an extra adds.', 'Hotel rating.'),

  // Materials, goods, crops
  producedBy: d('Where the Material comes from.', 'Production chains.'),
  durationMinutes: d('How long it takes to make, in minutes.', 'Production.'),
  value: d('Urbs a unit sells for, and the base of the price of a Rush.', 'Shops, the market and Rushing a Slot.'),
  recipe: d('The Materials and Crops it consumes, by id and quantity.', 'Production.'),
  growthMinutes: d('How long the Crop takes to grow, in minutes.', 'Farming.'),
  'crops.yield': d('Units gathered per harvest.', 'Farming.'),
  seedShare: d('Share of the harvest kept as seeds.', 'Farming.'),
  seedPrice: d('Urbs per seed.', 'Farming.'),
  packingMinutes: d('How long packing takes, in minutes.', 'The Packhouse.'),
  packedValue: d('Value of a packed unit.', 'The Packhouse and shops.'),
  growth: d('The model of each growth stage.', 'The Fields in the scene.'),
  produce: d('The model of the harvested produce.', 'The scene.'),
  harvested: d('The model of the field once harvested.', 'The scene.'),

  // Boats and vehicles
  operatingCostPerHour: d('Urbs per hour while the Boat operates.', 'The city’s hourly costs.'),
  propulsion: d('Electric vehicles draw power; coal ones burn coal.', 'Power balance, coal use and emissions.'),
  coal: d('Coal burnt per hour.', 'Coal consumption.'),
  'transitVehicles.cost': d('Urbs per hour to run the vehicle.', 'The city’s hourly costs.'),
  emissions: d('Emissions per hour.', 'Pollution and temperature.'),
  weight: d('Share of the ambient traffic made of this car.', 'The cars spawned on roads.'),
  facility: d('The Public facility that sends this vehicle.', 'Service trips to Homes.'),

  // Models
  file: d('The model file, as <pack>/<name>.', 'Loading of the model.'),
  source: d('Where the model comes from.', 'Credits and licensing.'),
  license: d('The license the model is shared under.', 'Credits.'),
  author: d('Author of the model.', 'Credits.'),
  url: d('Where the model was found.', 'Credits.'),
  scale: d('Scale applied when the model is shown.', 'The scene and the preview.'),
  center: d('Offset that centers the model.', 'The scene and the preview.'),
  fit: d('Size the model is fitted to.', 'The scene.'),
  width: d('Width the model is fitted to.', 'The scene.'),
  height: d('Height the model is fitted to.', 'The scene.'),
  rotationOffset: d('Rotation applied to the model, in degrees.', 'The scene.'),
  bakeNodeScale: d('Applies the scale of the model’s nodes to its geometry.', 'Loading of the model.'),
  recolor: d('Colours the model can take, and named variants of them.', 'The scene.'),
  note: d('Free comment on the model.', 'The editor only.'),

  // Economy balance
  tax: d('The tax Citizens pay.', 'City income.'),
  urbsPerCitizenPerHour: d('Urbs each Citizen pays per hour.', 'City income.'),
  capHours: d('Hours of taxes that can pile up before they are collected.', 'City income.'),
  market: d('How the price of a Good falls as it is sold and recovers.', 'Selling on the market.'),
  fullPoints: d('The price in points when nothing was sold lately.', 'Selling on the market.'),
  floorPoints: d('The lowest price in points.', 'Selling on the market.'),
  pointsLostPerUnit: d('Points the price loses for each unit sold.', 'Selling on the market.'),
  recoveryMinutes: d('Time the price takes to recover from the floor to full, in minutes.', 'Selling on the market.'),
  slotPrices: d('Price of a Slot, by the number of Slots it brings a building to.', 'Buying Slots.'),
  rush: d('Price of the Rush, the Urbs paid to complete a production at once.', 'Rushing a Slot.'),
  priceFactor: d('Price of a Rush with all the time left, as a multiple of the value of what is produced; it falls to the minimum as time runs out.', 'Rushing a Slot.'),
  minPrice: d('The lowest price of a Rush, in Urbs.', 'Rushing a Slot.'),
  parcelPricing: d('Price of the next Parcel: base × factor ^ Parcels bought, rounded.', 'Buying Parcels.'),
  base: d('Price of the first Parcel.', 'Buying Parcels.'),
  factor: d('Growth of the price with each Parcel bought.', 'Buying Parcels.'),
  roundTo: d('The price is rounded to a multiple of this.', 'Buying Parcels.'),
  shop: d('How shops stock and sell.', 'Shops.'),
  stackSize: d('Units a shop stack holds.', 'Shops and the tutorial.'),
  saleIntervalMinutes: d('Time between two sales of a stack, in minutes.', 'Shop sales.'),

  // Venues balance
  staff: d('What Staff costs and yields.', 'The Staff panel and Venue earnings.'),
  dayHours: d('Hours in a wage day.', 'Wages.'),
  dailyWage: d('Urbs a person of each role earns per day.', 'Wages and hiring fees.'),
  hireFeeDays: d('Hiring costs this many days of wages, once.', 'Hiring Staff.'),
  managerYield: d('Multiplier on earnings when a manager is hired.', 'Venue earnings.'),
  frontBaseRate: d('Share of visitors served with nobody at the front desk.', 'Venue earnings.'),
  frontRatePerHire: d('Share added for each person hired at the front desk.', 'Venue earnings.'),
  withoutSecurityRate: d('Multiplier on earnings when the Venue has no security.', 'Venue earnings.'),
  'venues.venue': d('Rules shared by every Venue.', 'Venue rules.'),
  reachRadius: d('How far, in tiles, a Venue draws visitors from.', 'Neighbourhood visitors.'),
  playPrice: d('The price that visitors accept without hesitation.', 'Venue visitors.'),
  minPrice: d('The lowest price a Venue can set.', 'Venue pricing.'),
  maxPrice: d('The highest price a Venue can set.', 'Venue pricing.'),
  priceTolerance: d('How much acceptance drops for each Urb above the play price.', 'Venue visitors.'),
  refundRatio: d('Share of a Fixture’s price refunded when it is removed.', 'Removing a Fixture.'),
  events: d('How Venue events run.', 'Venue events.'),
  cancelRefund: d('Share of the budget refunded when an event is cancelled.', 'Venue events.'),
  cooldownMinutes: d('Time before another event can be planned, in minutes.', 'Venue events.'),
  maxDelayHours: d('How many hours ahead an event can be planned.', 'Venue events.'),
  'venues.minRank': d('The Rank a Venue must have reached to plan events.', 'Venue events.'),
  roadTierCosts: d('Urbs per tile to build or upgrade a road to each Tier.', 'Road building.'),

  // Infrastructure
  pieces: d('The model of each piece of road.', 'Road drawing.'),
  customers: d('The characters shown as visitors of every Venue.', 'The Venue crowd.'),
  parkTree: d('The tree planted in parks.', 'The scene.'),
  roofPanel: d('The solar panel set on a Home roof.', 'The scene.'),
  groundPanel: d('The ground-mounted solar panel.', 'The scene.'),
  road: d('The road piece used at the ends of a bridge.', 'Bridges in the scene.'),
  straight: d('The straight piece.', 'The scene.'),
  corner: d('The corner piece.', 'The scene.'),

  // Pack formats
  formats: d('How the Packhouse packs a Crop Material into Goods.', 'Pack Goods (Crate, Box, Pallet).'),
  suffix: d('Word added to the Crop id to name the pack.', 'Pack Goods.'),
  size: d('How many units a pack holds.', 'Packing.'),
  valueBonus: d('Multiplier on the value of the packed units.', 'Shop and market prices of packs.'),
  families: d('The codex description of each family of nature elements.', 'Codex.'),
}

export function docOf(key: string, scopes: readonly string[]): FieldDoc | undefined {
  for (const scope of scopes) {
    const scoped = DOCS[`${scope}.${key}`]
    if (scoped) return scoped
  }
  return DOCS[key]
}
