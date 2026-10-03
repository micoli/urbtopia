# Ecological city

Status: Implemented — validation recorded in [validation.md](validation.md)

Implementation tickets: [Index and dependencies](README.md)

## Purpose

Make ecology a central, understandable part of city management. Teach demand reduction first, then energy mix, local energy sharing and public transport. Use simplified, coherent mechanics with visible tradeoffs rather than a realistic engineering simulation.

## Confirmed decisions

- Ecological choices provide economic savings, attractiveness and quality-of-life benefits. A polluting city remains playable with visible disadvantages.
- Green spaces improve local cooling, biodiversity and citizen well-being. Keep these indicators distinct; parks do not automatically offset industrial emissions.
- Green-space benefits depend on proximity, with additional benefits for connected spaces.
- Offer trees and small parks initially. Both use land and cost Urbs.
- Solar equipment is optional, costs Urbs and is available at construction or as a retrofit.
- Per the developer, `building-type-j`, `building-type-u` and `building-type-b` already have visible panels. Treat these as more expensive solar Home variants; their visible panels must produce energy.
- Retrofitted Homes receive visible panels using the industrial assets.
- Industrial solar panels can also form standalone neighborhood installations, producing more energy while occupying land.
- Prioritize self-consumption, then automatically share surplus with nearby Homes within a limited radius. Visualize beneficiaries and transferred energy.
- Make wind energy prominent. Industrial windmill assets are available; the existing Power plant is already rendered as a windmill.
- Extend energy Demand to economic buildings, especially Workshops and Factories.
- Solar production varies with time of day. Allow temporary energy deficits that reduce production and satisfaction without destroying buildings.
- Provide a separate, paid Home insulation upgrade that reduces energy Demand. Explain energy saved alongside energy generated.
- Start public transport with player-defined bus lines. Stops must have visible signs, be placed beside roads and serve nearby buildings. Useful lines connect Homes and activity locations.
- Transport usage depends on coverage of Homes and activity locations and reduces automobile Traffic and its ecological impact.
- Open MaximalStats from both MinimalStats and CityStats across all HUD layouts.
- Show economic building counts, actual production and available capacity; energy Demand, production by source and local transfers; transport coverage and usage; green spaces, cooling, biodiversity and well-being; emissions and actionable explanations.
- Represent city efficiency with explained indicators rather than a single opaque score.
- Provide paid neighborhood batteries with limited storage capacity. Wind varies according to a predictable cycle, with forecasts visible to the player.
- During energy shortages, prioritize Homes, then proportionally reduce economic building activity. Explain unmet Demand and consequences.
- Calculate bus usage from coverage of Homes and activity locations without simulating individual citizen journeys. Show moving buses; each line has an operating cost in Urbs.
- Use transparent game-specific ecological indicators instead of invented scientific quantities. Track activity and transport emissions, energy savings, biodiversity and cooling separately.
- Unlock ecological options progressively through short practical objectives, introducing the first options early in a game.
- Deliver three playable stages: management dashboard, insulation and green spaces; then energy generation, sharing and batteries; then public transport. Each stage includes pedagogical explanations.
- Add a dispatchable polluting backup Power plant with operating costs and emissions. Identify wind Power plants explicitly as wind energy.
- Cap benefits by actual need. Overlapping bus stops do not count the same Citizens multiple times; green spaces have diminishing returns; shared power cannot exceed available surplus or recipient Demand.
- Preserve existing cities and phase in new constraints through an announced adaptation period and a diagnostic of the city's needs.
- Keep costs, radii and yields in an explicit balancing table, validated on small reference cities before release.

## Delivery stages

### 1. Management, demand reduction and green spaces

Provide MaximalStats access in every layout, explain current energy needs and economic production, add insulation, trees and small parks, and introduce local green-space indicators. Clearly distinguish measurements available now from mechanics introduced in later stages.

### 2. Energy mix and local distribution

Introduce solar Home variants and retrofits, standalone solar installations, clearly identified wind generation, predictable production cycles, neighborhood batteries, surplus sharing, economic energy Demand, backup generation and shortage allocation. Include forecasts, transfer visualization and the existing-city adaptation flow.

### 3. Public transport

Introduce visible roadside stop signs, player-defined bus lines, coverage-based usage, operating costs, visible buses and reduced automobile Traffic and emissions. Explain coverage and overlap in MaximalStats.

## Acceptance criteria

- Visible solar panels correspond to active generation; retrofits change the Home's appearance.
- Self-consumption takes precedence over sharing. Transfers respect range, surplus and unmet recipient Demand without duplicating energy.
- Storage never exceeds its capacity; charging and discharging preserve energy accounting.
- Production cycles, transport effects and catch-up are deterministic under the injected clock.
- Shortages prioritize Homes and reduce economic activity proportionally without destroying buildings.
- Green-space and transport coverage overlap respects the confirmed caps and diminishing returns.
- Every bus stop has a visible sign beside a road; lines connect selected stops and incur operating costs.
- MaximalStats opens from both HUD statistics components and explains each indicator's contributing factors.
- Ecological quantities are identified as game indicators; green-space benefits do not erase industrial emissions.
- Existing saves retain buildings and progress through a versioned migration and a visible adaptation flow.
- New text is available in FR and EN; mobile, tablet and desktop interactions remain supported.
- Validate costs, ranges and yields against reference cities before releasing each relevant stage.

## Current implementation and constraints

- Energy Capacity and Demand are currently city-wide sums. Only Homes have energy Demand; actions that exceed Capacity are currently rejected.
- Vehicles currently have no simulation effect. Public transport introduces mobility and ecological simulation rules.
- MinimalStats appears in Layout B; other layouts use CityStats.
- Preserve pure deterministic core logic, injected time and the existing catch-up behavior, including its 48-game-hour limit.
- Derive statistics from source state. Changes to persisted state require a save version migration and compatibility validation.
- CONTEXT.md describes six Home Tiers while the implementation has eight; reconcile this when updating domain documentation.
- Revisit the global-utility decision in `.scratch/urbix-mvp/spec.md` and the decorative-Traffic decision in `.scratch/vehicle-traffic/spec.md` when the new design is finalized.

## Implementation preparation

The design interview is complete. Exact costs, radii, production curves, storage rules, adaptation duration, unlock thresholds and balancing formulas require a concrete initial table during implementation preparation. These values are not implicitly approved by the conceptual decisions above. Check the available model files for the developer-named assets and provision missing runtime assets as needed.

During implementation preparation, split each delivery stage into individual implementation issues following the local tracker conventions. Update the domain glossary and affected architectural decisions alongside the relevant implementation.

## References

- `CONTEXT.md`
- `docs/agents/issue-tracker.md`
- `docs/adr/0002-pure-core-injected-clock-replay-catch-up.md`
- `docs/adr/0003-localstorage-versioned-save-envelope.md`
- `.scratch/urbix-mvp/spec.md`
- `.scratch/vehicle-traffic/spec.md`

## Comments

- The developer confirmed the recommendations for Q1–Q16, including visible bus-stop signs and the named solar Home assets.
- The developer confirmed the recommendations for Q17–Q21: batteries, predictable wind, energy allocation, simplified bus usage, game-specific indicators and progressive teaching.
- The developer confirmed the recommendations for Q22–Q25: staged delivery, polluting backup generation, bounded benefits and existing-save adaptation with reference-city balancing.
- The developer approved the complete specification and final synthesis. The design interview is closed; gameplay implementation has not started.
- The developer requested implementation tickets; 20 individual tickets now cover preparation and the three delivery stages. Gameplay implementation has not started.
