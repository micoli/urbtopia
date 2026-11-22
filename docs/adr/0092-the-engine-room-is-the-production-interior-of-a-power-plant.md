---
status: accepted
---

Accepted, amended by [ADR 0093](0093-fixtures-are-templates-with-ports-effects-and-traits.md): the Circuits are derived from the ports of the Fixtures, no longer listed as flowcharts in the balance file.

# The Engine room is the Production interior of a Power plant

A Power plant has no interior today. The Coal Power plant, the Hydro power plant, the Geothermal power plant and the Large geothermal power plant supply a fixed Capacity by Tier. The player wants to build their machinery from the inside, in the same Management view as a Factory or a Recycling plant, and to be rewarded for a working circuit.

## Decisions

- **A Production interior, not a fourth family.** The Engine room belongs to the Production family of [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md): its bonus is "produces more", and nothing in it is a service. It is declared by an Interior profile like every other interior ([ADR 0081](0081-interior-profile-is-the-one-seam-of-the-interior-family.md), [ADR 0084](0084-the-interior-profile-answers-the-numbers-and-the-bonus-model.md)), never deduced from the type in code. The Interior families stay three.
- **Four buildings.** The Coal Power plant, the Hydro power plant, the Geothermal power plant and the Large geothermal power plant. The wind and the solar plants have no circuit to build and no Engine room.
- **A typed graph of Lines.** The engine of the Recycling interior's Line ([ADR 0076](0076-recycling-interior-moves-capacity-and-collection-distance.md)) is generalized: a Fixture declares typed ports (coal, water, steam, electricity) and a circuit is a graph of Fixtures joined by typed links. What it shows on a link is a picture, never counted.
- **Links are Fixtures laid by hand.** A coal Conveyor (the Conveyor of the Packhouse, drawn with lumps of coal) carries coal; the new Water pipe, Steam pipe and Cable carry the other mediums. Two mediums never share a tile.
- **Ports stand against the walls.** The Coal quay, Water inlet, Water outlet, Underground water inlet, Injection well and Power outlet stand against an edge, on the tile along it, facing the room, like the Intake and the Exit of the Packhouse and Recycling interiors. A circuit needs one of each of its ports.
- **Circuits.**
  - Coal: Coal quay → (coal) → Steam boiler; Water inlet → (water) → Steam boiler; Steam boiler → (steam) → Alternator → (electricity) → Power outlet.
  - Hydro: Water inlet → (water) → Water turbine → (water) → Water outlet; Water turbine → (electricity) → Power outlet.
  - Geothermal: Underground water inlet → (steam) → Steam turbine → (steam) → Condenser → (steam) → Injection well; Steam turbine → (electricity) → Power outlet.
- **All or nothing per circuit.** A circuit counts only when every edge of its flowchart is linked and no Fixture on it has broken down. Several complete circuits are allowed in a large room, each adding less than the one before, up to the maximum of the plant's Tier.
- **A typed graph, one module.** `engineRoomCircuits.ts` reads the ports of the Fixtures (`ports`: side, Medium, in/out/both) and the Circuits declared in the balance file (an anchor family and the links of its flowchart). A Medium goes from a Fixture to the next through ports of the same Medium that face each other, an out port onto an in port; it crosses unbroken links (family `link`) and stops at any other Fixture. A Circuit takes, for each family of its flowchart, one Fixture no other Circuit uses.
- **A bonus, never a requirement.** An empty Engine room leaves the plant exactly as it was. The bonus is a percentage of the plant's Capacity, capped by its Tier and never reached (diminishing returns, full up to half the cap). The Coal Power plant also lowers its pollution, but only for a Circuit whose Steam boiler has a **Filter**: a Fixture that stands in front of the boiler and takes its smoke (a fifth Medium, `smoke`, an optional `cleaning` link of the Circuit). Without the Filter the Circuit still counts and raises the Capacity. The bonus then multiplies the Well-being malus the plant inflicts on nearby Homes, without touching its Capacity or its reach.
- **Wear and one Staff role.** Fixtures wear and a Technician repairs them, hired like those of the Factory interior, with the wages paid by the player. A breakdown unlinks everything downstream.
- **No consumption of its own.** The Engine room draws nothing from the city's electricity Demand, spends no coal and no water (the coal a Coal Power plant burns stays paid in Urbs for the electricity it delivers, as before), and its Production interior has no power switch of its own beyond the breaker every Production interior has.
- **Starting values** (in the Interior profile, to balance in play). Bonus caps: Coal +8 % (Tier 1) to +30 % (Tier 4); Hydro +6 % to +20 % (Tier 3); Geothermal +5 % to +25 % (Tier 6); Large geothermal +25 %. Pollution: down to −40 % of the malus at Coal Tier 4. Grid: 6×6 at Tier 1, +2 per Tier, at most 14×14; the Large geothermal plant takes the largest. Unlock: Coal 400, Hydro 500, Geothermal 600, Large geothermal 1500 Citizens.
- **Delivery.** The 3D models come first, one Fixture at a time. Then three pull requests: the typed graph engine with the Coal plant, the Hydro plant, the Geothermal plants. The guided demonstration ([ADR 0080](0080-guided-demonstrations-replay-semantic-scripts-in-an-isolated-interior.md)), the Codex and the Release note follow.

## Considered options

- **A fourth Interior family "Power".** Rejected: it would amend ADR 0070 for a family whose only rule, "a bonus to what the building produces", is the Production one.
- **Drive and Flow of the Factory interior.** Rejected: they carry two mediums and no direction of production, while a power plant chains four mediums from a wall port to a wall port.
- **A bonus that counts a partial circuit.** Rejected: a half-built circuit would be a bonus for nothing; the all-or-nothing rule of the Recycling line gives a clear goal.
- **A real consumption of coal and water.** Rejected: the plants have no running cost in their definitions, and a stock to feed would add a second economy for a bonus.

## Consequences

- `CONTEXT.md` gains Engine room and its Fixtures; Power plant points to it.
- New Fixtures: Coal quay, Water inlet, Water outlet, Underground water inlet, Injection well, Power outlet, Steam boiler (not the Boiler of the Factory interior), Alternator, Water turbine, Steam turbine, Condenser, Water pipe, Steam pipe, Cable. Their 3D models live under `assets/managed-models/engine-room/`.
- The Interior profile gains the Engine room for four buildings, with the bonus caps and the pollution factor in JSON.
- The saved layouts and the i18n (en, fr) gain the new Fixtures.
