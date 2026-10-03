# Reference city-builder mechanics (research notes)

Scope: mechanics of a popular mobile city builder ("the reference game"), summarized for a web clone (JS, no server).
All figures come from the community wiki pages listed in [Sources](#sources); each claim carries a source key `[Sn]`.
Figures reflect the wiki at the time of research (Oct 2026) and may be community-edited or outdated; no official publisher page was consulted (none was reachable/needed for these numbers). Text is summarized, not copied.
Currency naming used here: "soft currency" (common, earned in play), "premium currency" (scarce, paid/rare), "regional currency", "keys" (special rare currency).

## 1. Currencies

- Soft currency is the main currency; the player starts with 25,000 and earns it from tax collection, selling to other players, cargo deliveries, daily chests, bulldozing, events and upgrading residential zones [S29]. Starting balances: 25,000 soft + 50 premium [S31].
- Premium currency: starts at 50; earned via achievements, ads, weekly chest, events, contests, or bought with real money; used to buy premium buildings, speed up production, buy other currencies and add production/sale slots [S30].
- The reference game has ~12 currencies in total (regional currencies, keys, rail currency, etc.) [S31]. Not needed for an MVP.

## 2. Raw materials and factories

- Factories (the "industrial" category) produce raw materials; 12 factories can be owned by level, plus 5 regional factories [S1].
- Raw material table (production time / unlock level / max sale value per unit) [S1]:

| Material | Time | Level | Max sale |
|---|---|---|---|
| Metal | 1 min | 1 | 10 |
| Wood | 3 min | 2 | 20 |
| Plastic | 9 min | 5 | 25 |
| Seeds | 20 min | 7 | 30 |
| Minerals | 30 min | 11 | 40 |
| Chemicals | 2 h | 13 | 60 |
| Textiles | 3 h | 15 | 90 |
| Sugar and Spices | 4 h | 17 | 110 |
| Glass | 5 h | 19 | 120 |
| Animal Feed | 6 h | 23 | 140 |
| Electrical Components | 7 h | 29 | 160 |

- Mechanics: queue a material into a factory slot; production continues while the game is closed; finished goods wait on top of the building until collected; production can be sped up with premium currency (cost depends on remaining time) or speed-up items [S1].
- Factory types (price / slots / pollution radius / requirement) [S1]:
  - Small: free, 2 slots, 12x12, none.
  - Basic: 500, 3 slots, 10x10, 4,000 population.
  - Mass Production: 7,000, 4 slots, 8x8, 27,000 population.
  - High-tech: 20,000, 5 slots, 6x6, 80,000 population.
  - Nano-tech: 50,000, 5 slots, no pollution, 150,000 population.
- Number of factories allowed by player level: level 1 -> 2, 2 -> 3, 3 -> 4, 6 -> 5, 12 -> 6, 18 -> 7, 24 -> 8, 30 -> 9, 37 -> 10, 46 -> 11, 58 -> 12 [S1].
- Regional factories: 15,000 cost, 5 slots, level 25, each produces a single regional raw material in 6 minutes [S1].
- Raw materials have a dedicated storage: unlocked at level 4, starts at capacity 10 (20 after building the storage building), upgraded in +3 steps with special storage items [S4]. General item storage starts at 30 (40 with the building), +5 per upgrade, caps around 1,100 [S3]. When full, the player cannot collect more from buildings [S3].

## 2b. Commercial buildings (shops: crafted goods)

- Shops craft goods from raw materials and other goods; 14 permanent shops + 5 regional + seasonal ones [S2].
- Start with 2 production slots, buy more up to 11 with premium currency; slot price grows linearly (e.g. most shops: slot 3 = 8, slot 4 = 14 ... slot 11 = 56; total 288 for all slots) [S2].
- Three upgrade stars reduce production time by 10 / 15 / 20 percent; upgrades cost soft currency and need a player level [S2].
- Unlock levels / prices (soft currency) [S2]: Building Supplies 100 (L1); Hardware 2,500 (L4); Farmer's Market 5,000 (L8); Furniture 8,000 (L10); Gardening 13,000 (L14); Donut Shop 17,000 (L18); Fashion 22,000 (L19); Fast Food 25,000 (L25). More shops follow later [S20].
- Goods are used to upgrade residential zones, fulfil deliveries, contest tasks, or are sold to other players [S32].

## 3. Population and residential growth

- Residential zones are free and unlocked at level 1; 16 types exist (differing in max population, service demand and unlock) [S17]. The basic zone has 6 upgrade tiers, max population 1,836, and is the only one that can become an "epic" building at tier 6 [S18][S17].
- Service demand per building is low / medium / high = 1 / 2 / 5 units of each required service [S17].
- Upgrade flow: tap the build icon on a zone, see required goods and rewards, drag the goods onto the zone; upgrade is near-instant and gives experience and soft currency; population does not drop during the upgrade and new residents appear immediately. The required-goods plan can be rerolled or moved to another building, each with a 30 minute cooldown [S17].
- Wealth forecast (low/premium/luxury) only affects the visual variant, not tax revenue [S18][S17].
- A zone without required services, or without a road, is abandoned; abandonment reduces population and tax income [S12][S15].
- Tax: collected by tapping the city hall (unlocked at level 5) [S24].
- Specialization buildings (parks, education, etc.) boost population beyond the base maximum in a boost area [S18].

## 4. Services

Three behavior classes [S12]:
1. Capacity-only, can be placed anywhere connected by road: power, water, sewage, waste.
2. Area coverage + capacity, must be near homes: fire, police, health (and regional services).
3. Special: government (utility buildings, capital only), mass transit (optional, encouraged).

Since a 2026 update every service building can be upgraded (tiers raise capacity) [S12].
Unlock levels [S5][S6][S7][S9][S10][S11][S8][S16][S24]: power L1, water L1, fire L5, sewage L8, police L12, mass transit L13, waste L14, health L16; city hall L5.

Sample numbers (price L1 -> max capacity):
- Power [S5]: Wind plant 1,500, capacity 6 -> 20 (3 levels, 1x1, no pollution); Coal 1,000, capacity 10 -> 35 (3 levels, pollution 10x10); more plants unlock by population (e.g. 2,000 population for the deluxe wind plant, capacity 15 -> 90).
- Water [S6]: Basic tower 4,000, capacity 10 -> 70 (3 levels); Pumping station 7,500, capacity 45 -> 450 (5 levels).
- Sewage [S7]: small pipe 3,000, capacity 55 up to ~160+ over its levels; basic pipe 4,000, 90 -> 360+.
- Waste [S8]: small dump 5,000, capacity 90 -> 405, pollution 10x10; garbage dump 8,000, 135 -> 675, pollution 12x12.
- Fire [S9]: small 1,700, capacity 50 -> 200, coverage 6x8; basic 2,250, 100 -> 500, 10x12; deluxe 5,000, 200 -> 2,000, 22x22.
- Police [S10]: small 3,000, capacity 100 -> 200+ (3 levels); basic 4,000, 200 -> ...; precinct 8,000, 250 -> ...
- Health [S11]: small clinic 4,000, 100 -> 200+; clinic 5,000, 200 -> 400+; hospital 8,000, 250 -> 1,000+.
- Upgrade cost grows per level (examples: fire basic 2,500 / 2,750 / 3,000 / 3,250) [S9].
- Pollution radius on factories/dumps/coal plants is a design constraint on placement [S1][S5][S8].
- Education, parks, entertainment, gambling etc. are NOT mandatory services: they are "specializations" (population boosters) [S22][S23].

## 5. Specializations (high level)

- 10 specializations of optional buildings that boost population in an area [S31]. Examples: parks (level 3, 35 permanent + many limited buildings, boost area 8x8 to ~10x12, boost 5 to 25 percent) [S22]; education (level 10, needs a department building first, prices partly in keys) [S23]; landscape (L6), beach (L15), entertainment (L20), gambling (L25), transportation, mountain (L23), landmarks (L30), space (L40) [S20].
- Premium zone line (unlocked at level 30 via a lab/research chain) uses its own services and currency [S20][S12]; skip.
- Regional "hot spot" specializations are upgradeable to level 10: boost 15 percent -> 80 percent, area 12x12 -> 26x26, with population requirements per level doubling roughly each level [S21].

## 6. Trading and delivery

- Selling hub (sell to other players): unlocked at 8,000 population; 6 sale slots, up to 32 total (+26 slots at 10 premium each); price adjustable, minimum 1 per unit; advertise an item for 12 hours; NPC buyer purchases items that sit for 48 hours; withdraw an item for 1 premium [S13][S19].
- Buying hub: unlocked at 10,000 population; shows 20 items rotating every 30 seconds; buying visits the seller's city [S14][S19].
- Cargo ship dock: unlocked at 20,000 population; 3 request slots of 1-4 crafted goods; ship stays 18 h, next arrives 6 h later; reward is rare keys plus small soft currency [S28].
- Airport: unlocked at 120,000 population, costs 80,000 and ~31 h to build; 3 crates per shipment; destination-themed shipments (8 h to arrive, 10 h stay for the first) that unlock special residential zones [S27][S19].
- Regional export HQ: unlocked at 500 regional population; open 24 h every 1-4 days; trucks with 3 rows x 3 items [S26].
- Population milestones: 4,000 basic factory; 8,000 sell hub; 10,000 buy hub; 20,000 cargo dock; 27,000 mass-production factory; 80,000 high-tech factory; 120,000 airport; 150,000 nano-tech factory [S19].

## 7. Roads and transportation

- Roads are a tile-painting tool; every building except landscape needs a road connection. Unconnected homes are abandoned immediately; other buildings are disabled [S15].
- Traffic: heavy-use road segments turn yellow (moderate, residents complain) then red (heavy, homes abandoned); fix by upgrading roads [S15].
- Road ladder (unlock level, cost per tile in soft currency) [S15]: two-lane free (start); four-lane L9, 150-300; six-lane L15, 600-1,200; avenue L20, up to 1,500; boulevard L27; streetcar avenue L34, up to 2,500 (handles any traffic); premium maglev L37. Decorative roads (cobblestone L10, gravel L12, pedestrian L14) cost 10,000-12,000 per tile and handle any traffic [S15].
- Bulldozing: two-lane gives no refund; upgraded roads refund 50 percent of the last upgrade [S15].
- Mass transit (rail), level 13: stations need road access, nearby homes and track; no track length requirement; stations are not mandatory. Small station 5,000, 40 passengers, up to 6 slots (premium cost 4/8/16/24/32 per slot) ; medium 15,000, 60 passengers, 8 slots; large and metropolitan stations are premium-priced and gated by total passengers transported (e.g. 1,000, 10,000) [S16]. Track is free per tile [S15].
- Seaport (cargo dock) and airport are delivery mini-games rather than transport networks [S28][S27].

## 8. Regions

- Regions are satellite cities with their own residential, factory, shop, items, hot spots, regional service, currency, selling/buying hubs and export HQ; each region has increased demand for one service [S25].
- Unlock: first at player level 25, then 15,000 / 250,000 / 1,000,000 / 10,000,000 regional population [S25].
- Disaster/monster tower: unlocked at ~90,000 population; only mentioned briefly [S19]. Skip.

## 9. Progression by level and population

- Levels unlock materials, shops, factories, services and roads (see tables above); notable unlocks: L1 metal, building-supplies shop, 2 factories, power, water; L3 parks; L4 hardware, storage; L5 plastic, fire, city hall; L8 sewage; L9 four-lane roads; L10 furniture, education; L12 police; L13 chemicals, rail; L14 waste; L16 health; L25 regions, regional shops/factories; L30 premium zone line [S20][S24].
- Population thresholds gate the economy loop (section 6) [S19].

## Features worth including in an MVP vs later

MVP (a single-player loop that is fun without a server):
1. Grid map, road painting, building placement; "no road = abandoned/disabled" rule [S15].
2. Soft currency with starting balance 25,000 and a tax collection building [S29][S24].
3. 4-5 raw materials with the real time ladder (1 min, 3 min, 9 min, 20 min, 30 min) and 2-3 factory slots; offline progress by timestamps [S1].
4. 3-4 shops with 2 slots, crafting recipes and an upgrade (star) mechanic [S2].
5. Residential zones with tiers and goods-based upgrades that raise population [S17].
6. Services: power, water first (capacity, anywhere), then fire/police/health with area coverage; abandonment when unmet [S12].
7. Player level / population gating of unlocks (use population milestones and level table as a template) [S19][S20].
8. Storage caps (30 items / 10 raw) and capacity upgrades [S3][S4].
9. Local-only "market": simulate NPC buyers for a selling slot system instead of players [S13].

Later:
- Traffic model and road upgrades [S15]; pollution radius [S1].
- Sewage, waste, service upgrade tiers (capacity levels and costs) [S12][S7][S8].
- Specializations/boost areas (parks first), hot spots [S22][S21].
- Premium currency sinks (speedups, extra slots) [S30][S2]; ads-for-boost.
- Cargo dock and airport delivery mini-games [S28][S27].
- Rail/mass transit network [S16].
- Regions with regional currency [S25][S26].
- Any social/competitive layers (contests, clubs, passes, premium zone line) [S31][S20]: out of scope without a server.

## Sources

- S1 https://simcity-buildit.fandom.com/wiki/Industrial_Buildings
- S2 https://simcity-buildit.fandom.com/wiki/Commercial_Buildings
- S3 https://simcity-buildit.fandom.com/wiki/City_Storage
- S4 https://simcity-buildit.fandom.com/wiki/Material_Storage
- S5 https://simcity-buildit.fandom.com/wiki/Power
- S6 https://simcity-buildit.fandom.com/wiki/Water
- S7 https://simcity-buildit.fandom.com/wiki/Sewage
- S8 https://simcity-buildit.fandom.com/wiki/Waste_Management
- S9 https://simcity-buildit.fandom.com/wiki/Fire
- S10 https://simcity-buildit.fandom.com/wiki/Police
- S11 https://simcity-buildit.fandom.com/wiki/Health
- S12 https://simcity-buildit.fandom.com/wiki/Services
- S13 https://simcity-buildit.fandom.com/wiki/Trade_Depot
- S14 https://simcity-buildit.fandom.com/wiki/Global_Trade_HQ
- S15 https://simcity-buildit.fandom.com/wiki/Roads
- S16 https://simcity-buildit.fandom.com/wiki/Mass_Transit
- S17 https://simcity-buildit.fandom.com/wiki/Residential_Buildings
- S18 https://simcity-buildit.fandom.com/wiki/Residential_Zone
- S19 https://simcity-buildit.fandom.com/wiki/Population_Milestones
- S20 https://simcity-buildit.fandom.com/wiki/Level_Up_Table
- S21 https://simcity-buildit.fandom.com/wiki/Hot_Spots
- S22 https://simcity-buildit.fandom.com/wiki/Parks
- S23 https://simcity-buildit.fandom.com/wiki/Education
- S24 https://simcity-buildit.fandom.com/wiki/Government
- S25 https://simcity-buildit.fandom.com/wiki/Regions
- S26 https://simcity-buildit.fandom.com/wiki/Export_HQ
- S27 https://simcity-buildit.fandom.com/wiki/Airport
- S28 https://simcity-buildit.fandom.com/wiki/Cargo_Ship_Dock
- S29 https://simcity-buildit.fandom.com/wiki/Simoleons
- S30 https://simcity-buildit.fandom.com/wiki/Simcash
- S31 https://simcity-buildit.fandom.com/wiki/SimCity_BuildIt
- S32 https://simcity-buildit.fandom.com/wiki/Building_Materials
