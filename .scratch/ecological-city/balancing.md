# Ecological rules and provisional balancing

Status: Settled for autonomous implementation; values remain tunable.

## Units and time

Power is a game unit per hour; batteries store game energy units. Cycles use the injected clock, with hourly constant output and event boundaries at production-hour changes, battery exhaustion/fullness, adaptation expiry and operating-budget exhaustion. Integrate exact elapsed hours; repeated ticks and catch-up must agree within floating-point tolerance. Daylight hours 06–18 use a stepped sine curve; wind follows a predictable six-hour cycle [0.7, 0.9, 1, 0.8, 0.6, 0.75]. Forecast the next six hours. These are gameplay quantities, not scientific measurements.

## Buildings and progression

| Feature | Cost in Urbs | Unlock Citizens | Footprint | Effect |
| --- | ---: | ---: | --- | --- |
| Tree | 40 | 6 | 1×1 | Local green weight 1, radius 4 |
| Small park | 120 | 15 | 2×2 | Local green weight 3, radius 6 |
| Insulation | 80 × Home Tier | 6 | Existing Home | Demand reduced 30%; one purchase, persists through Tier upgrades |
| Solar Home / retrofit | Home cost + 180 / 180 × Tier | 15 | Home footprint | Peak output 2 × Tier |
| Solar installation | 400 | 32 | 2×2 | Peak output 16 |
| Battery | 350 | 32 | 1×1 | Capacity 24; rate 12; neighborhood radius 8 |
| Backup plant | 500 | 32 | 2×2 | Capacity 24; 0.5 Urbs per generated unit-hour |
| Bus stop | 60 | 32 | 1×1 beside road | Coverage radius 6 |
| Bus line | No setup cost | 32 | At least two distinct ordered stops | Operating cost 2 Urbs/hour; capacity 120 Citizens |

Wind uses existing Power plant costs and Tiers [12,24,40]. Water rules remain unchanged. Economic power Demand is workshop 1 × Tier, factory 2 × Tier, shop 0.5; other storage buildings zero. Demand does not depend on production-queue occupancy, avoiding incentives to clear a queue to evade capacity planning.

## Allocation and storage

Home solar self-consumption comes first. Home surplus goes only to neighboring Homes within radius 6, ordered by stable building ID. Remaining generation joins the city network. Wind and standalone solar then supply unmet Homes before economic buildings. Batteries discharge afterward, within radius 8 of demand; then backup supplies remaining Demand. Surplus is eligible to charge batteries in radius 8 of renewable generators. Backup never charges batteries. Never allocate more than unmet Demand or available power. Economic buildings share the remaining supply proportionally; Homes share general-network supply proportionally after local sharing. Battery moves retain stored energy; sale discards stored energy and refunds only base construction cost. No upgrades for new utility types initially.

## Costs and shortages

Bus operating costs and backup costs accrue continuously while enabled and affordable. When Urbs reach zero both paid services stop until funds are collected. Inactive/disconnected bus lines do not operate or cost Urbs. An active but poorly used connected line still costs Urbs. Tax is collected manually; green well-being offers up to 10% additional Tax. Home shortage reduces Tax accrual in proportion to supplied power; Citizens and buildings remain intact. Production and shop sales slow proportionally to economic power allocation. Existing cities receive 24 game hours of adaptation, with a visible diagnostic; during this period deficits do not slow production or reduce Tax, while generation/storage/cost accounting remains active. New cities receive the same adaptation to preserve the initial tutorial experience. Old tier-4 Homes already displaying panels become equipped without charge.

## Green benefits and emissions

Distance is Manhattan distance between building footprint centers. Local green weight sums within each contributor's radius. Adjacent green footprints form connected spaces with a capped 20% bonus. Cooling = 100w/(w+4), biodiversity = 100w/(w+6), well-being = 100w/(w+5), with w including the connectivity bonus. City scores are Citizens-weighted Home values; no Homes means zero. Attractiveness is represented by well-being and its bounded Tax benefit, not unexplained additional population. Trees/parks never subtract emissions. Activity emissions are workshop 0.5 × Tier and factory 2 × Tier, scaled by effective operation. Backup emissions = 2 × generated power. Automobile impact = unserved Citizens/10; bus impact = 0.5 per active line. All values are game impact units/hour.

## Transport

Attach each sign to its front road tile. Ordered stops form a line only when all consecutive stops have valid road paths; service runs there and back. Coverage requires a useful connection: at least one activity building and a Home near different stops on the same valid line. Covered Citizens are deduplicated between lines; riders capped at 120 per line and 70% of eligible Citizens. Each line gets riders in stable line-ID order. Move/removal and road edits recompute validity; missing or disconnected stops disable the line visibly, retaining configuration for repair. Roundabout roads remain routable. Buses are visual representations of paid active lines, not individually persisted agents.

## Objectives and validation cities

Teach insulation, a green space benefiting a Home, local solar sharing, storage during daylight and a useful bus route. Objectives derive from actual state; optional and skippable. Validate: a six-Citizen starter; a mixed 32–60 Citizen neighborhood with solar/storage; two overlapping solar neighborhoods; an established city in adaptation; overlapping useful/empty/disconnected bus routes; zero-Urbs service shutdown. Initial parameters are tuning values, not a claim of realistic physics.

## Technical constraints

Save only source state (equipment, stored battery energy, ordered line stops, adaptation deadline, Time skip offset and optional objective dismissal). Migrate version 3 to 4. Validate new fields and referential integrity. Keep the pure core free of scene/browser imports. FR/EN text and responsive, keyboard-accessible management are required.

## Asset choices

Existing CC0 trees compose small parks. A shipping container is the battery base, with its role explicitly identified in selection details. The existing industrial building-d is the backup plant. Empty roadside signs gain a readable BUS placard. Buses are a dedicated procedural body/windows/wheels composition, distinct from automobile models; no additional downloaded assets are needed.
