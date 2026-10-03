# Coal Power plants

Status: Implemented — verification recorded in [validation.md](validation.md)

## Confirmed decisions

- The player can choose a viable non-ecological energy policy.
- Coal Power plants can supply the entire city with stable power.
- Coal construction and Tier upgrades cost less than wind at comparable Capacity. Modest, visible operating costs keep coal economically viable over time.
- Coal generation emits pollution and causes a bounded decrease in nearby Home well-being, without making a coal-powered city unplayable.
- Four Tiers use `chimney-basic`, `chimney-small`, `chimney-medium` and `chimney-large`, in that order.
- The developer accepted the recommendations for interview questions Q1–Q3.
- Fuel is included in operating costs in Urbs; Coal Power plants do not consume the coal Material from storage.
- Keep the existing backup Power plant as a separate deficit-only service, preserving existing cities.
- Coal Power plants Unlock immediately, occupy a fixed 1×1 footprint at every Tier, and have Capacity 12, 24, 40 and 64.
- The developer accepted the recommendations for interview questions Q4–Q6.
- Construction costs 150 Urbs; upgrades to Tiers 2, 3 and 4 cost 300, 900 and 1800 Urbs respectively, with no Goods requirements.
- Operation costs 0.05 Urbs per delivered energy unit-hour. A fully used Tier-1 plant costs 0.6 Urbs/hour.
- Dispatch order is renewable generation, Coal Power plants, neighborhood batteries, then backup generation. Existing solar self-consumption and local sharing still precede city-network allocation.
- Each Coal Power plant has an on/off control. Coal supplies only unmet Demand, never charges batteries, and stops when Urbs are exhausted.
- Each operating Coal Power plant reduces nearby Home well-being by up to 10 points within radius 6, proportional to its utilization. The combined coal penalty is capped at 20 points per Home.
- Well-being can become negative. Extending the existing Tax modifier to negative scores limits the coal-related Tax reduction to 2% of base Tax.
- The developer accepted the recommendations for interview questions Q7–Q9.
- The developer confirmed the complete specification and defaults, and explicitly requested implementation.

## Tier balancing

| Tier | Model | Capacity | Construction or upgrade cost (Urbs) | Full-use operating cost (Urbs/hour) |
| --- | --- | ---: | ---: | ---: |
| 1 | `chimney-basic` | 12 | 150 | 0.6 |
| 2 | `chimney-small` | 24 | 300 | 1.2 |
| 3 | `chimney-medium` | 40 | 900 | 2 |
| 4 | `chimney-large` | 64 | 1800 | 3.2 |

These are initial gameplay balancing values. Validate the construction advantage, ongoing affordability and long-term tradeoff against reference cities; a permanent total-cost advantage over wind is not guaranteed by lower construction costs.

## Existing behavior

- Wind Power plants cost 250 Urbs and have nominal Capacity 12, 24 and 40. Wind generation varies with a predictable cycle.
- The existing backup Power plant costs 500 Urbs, has Capacity 24, and operates only after renewable generation and batteries. It charges 0.5 Urbs per generated energy unit and consumes no stored coal.
- The coal Material is currently unlocked at 600 Citizens and requires a Tier-4 Workshop. Early coal generation cannot depend on that supply without changing its availability.
- Energy emissions are currently reported without a local well-being penalty.
- The four requested models are available in the local industrial asset archive and require runtime provisioning.

## Confirmed defaults

- Coal emits 2 game impact units per delivered energy unit, matching the existing backup emission rate. Green spaces do not erase these emissions.
- New plants start enabled, require no adjacent Road, and retain the same footprint through upgrades.
- Split required coal generation proportionally to enabled plants' Capacity so local utilization and pollution do not depend on arbitrary building order.
- Use the existing Manhattan distance between footprint centers for the local penalty. A plant with no delivered generation causes no operating cost, emissions or local penalty.
- Apply the penalty to the existing green-space well-being score, with no additional health, population-loss or destruction mechanics. Cooling and biodiversity remain separate indicators.
- Preserve Home-first allocation and the existing allocation rules for economic buildings and electric transit.
- Preserve existing wind and backup buildings without conversion. Version and validate new saved coal buildings and their on/off state.
- Construction, upgrades, enable/disable, selection details and city energy statistics expose the coal option in FR/EN. The existing Tutorial remains playable; ecology choices remain optional.

## Acceptance criteria

- A coal-only city receives stable power up to enabled Capacity whenever operation is affordable.
- The four Tiers render the specified models and expose the agreed costs and Capacities.
- Mixed cities follow the agreed dispatch order without duplicate supply or fossil charging of batteries.
- Disabled, unused and unaffordable plants incur no operating costs or pollution.
- Budget exhaustion and collection resume behavior remain consistent between live ticks, Time skip and Catch-up.
- Local pollution scales with delivered generation, stacks only to its cap, and changes Home Tax through the bounded well-being modifier.
- Statistics distinguish available Capacity, delivered coal power, operating cost, emissions and local well-being penalties.
- Saving and loading preserves the plant's Tier and on/off choice; existing wind and backup cities remain intact.
- Reference cities cover a starter, coal-only city, mixed city with batteries, overlapping pollution zones, and a zero-Urbs city. Verify the operating-cost model and bounded Tax penalty keep coal viable.

## Constraints

- Preserve existing cities and wind Power plants.
- Keep time integration and Catch-up deterministic, including operating-budget exhaustion.
- Expose costs, delivered energy and pollution clearly in FR and EN.
- This feature extends the renewable-and-backup energy policy documented in ADR-0005; document any agreed dispatch change before implementation.
