---
status: proposed
---

# The Farm interior runs an irrigation circuit and a harvest Line on one Motor

Extends [ADR 0070](0070-interiors-come-in-three-families-venue-production-and-service.md), [ADR 0074](0074-mill-staff-is-assigned-to-a-millstone-and-the-pipes-carry-the-grain.md), [ADR 0079](0079-livestock-pens-are-fed-by-a-line-and-worked-by-a-herder.md) and [ADR 0084](0084-the-interior-profile-answers-the-numbers-and-the-bonus-model.md). The Farm was the last building of the cultivation chain with no interior. [ADR 0045](0045-livestock-farm-is-a-workshop-fed-by-crops.md) keeps it a building that produces nothing: its interior cannot add speed or output to a queue it does not have.

## Decisions

- **A Production interior with the `line` bonus model.** `farm` joins `interiors.json` with the family `production`, five grid sizes (5, 6, 7, 8, 9), the Citizens threshold 60 and the technician posts `[0, 0, 1, 1, 2]`. Its Fixtures wear and a Technician repairs them, as in the Livestock farm. No new puzzle mechanic: it reuses the Link engine.
- **Two circuits, one lever each.** The **irrigation circuit** (Drive and Flow: Motor, Gears and Shafts, Pump, Tank, Pipes, **Sprinklers**) raises the Field cap. The **harvest Line** (Drive and Flow: **Intake** against the back wall, **Washer**, **Thresher**, **Grader**, **Harvest bin**) raises the yield of the Harvest. The Washer needs Flow, the Thresher and the Grader need Drive. A Line whose Washer has no Flow is incomplete.
- **The circuits share the Motor and the Tank.** The Drive is split by Gears and Shafts under the jam rules of the Link engine, and a Tank feeds at most three Machines, the Washer and the Sprinklers counted together. This coupling is the puzzle.
- **Field cap by Farm, yield by the best Farm.** The Field cap bonus of a Farm is a share of its own Field cap, added to it, so the Field caps of several Farms still add up. The Harvest is a gesture on a Field and the Fields belong to no Farm, so its yield is that of the best Farm interior in the city, never the sum. Caps by Tier: yield 0.05, 0.10, 0.15, 0.20, 0.25; Field cap 0.10, 0.20, 0.30, 0.40, 0.50. These are starting values to balance in `interiors.json`.
- **Two roles.** A **farmhand** is assigned to a Harvest bin and delivers the yield part, an **irrigator** to a Sprinkler and delivers the Field cap part, one to one, 1 to 5 posts of each by Tier, in proportion to the posts hired, as in [ADR 0071](0071-an-interior-role-carries-its-own-part-of-the-effect.md). The irrigator does nothing by itself.
- **The farmhand harvests one species by himself.** The player picks on the Harvest bin a Crop species, among those unlocked. The farmhand assigned to it then harvests the **ready Fields of that species, anywhere in the city**, at a rate of Fields per hour set by the Tier (`harvestPerHour` in `interiors.json`, per bin). Each Field is harvested once, with the rules of the player's Harvest: the same yield (that of the best Farm), the same share of Seed packs, the same storage in the Grain silo. The bin must be reached by a complete Line, with its farmhand assigned, and the city must have the Urbs for an hour of the Staff's wages. A full Grain silo stops him without loss: the crop stays on its Field. The credit of an idle hour is not banked, so a farmhand never empties a map that ripened all at once. Bins of the same species add up their rates, and a Field goes to the first bin by id. The player's Harvest gesture stays, and a bin with no species harvests nothing, though its assigned farmhand still delivers the yield bonus.
- **Invariants of the family.** An empty interior leaves the Farm exactly as it was. The bonus is capped by the Tier. The save holds the Fixtures and the Staff, never the Links or the bonus.
- **Names.** Grader, not Sorter (the Recycling plant's Machine); Harvest bin, not Seed bin (the output is Crop Material, never Seed packs); Sprinkler for the Fixture and irrigator for the role.

## Why

Cultivation was the one trade with no layout to solve. A Line alone would copy the Storehouse and the Livestock farm. Putting Pipes beside it, with the Motor and the Tank shared, gives the player a real trade-off between the Field cap and the yield, in the same Link engine that the Mill, the Dairy and the Bakery already use.

## Implementation notes

- A Farm interior has as many Harvest bins and Sprinklers as it has posts of the farmhand and of the irrigator at its Tier. A bin or a Sprinkler counts only once its worker is assigned to it. The engine of the assistants leaves the two roles out; the harvest of the farmhands is its own step of the game's advance.
- The Line must pass through a Washer (`requires` in `interiors.json`), and a Tank's limit of three Machines that take Flow now counts the Washer and the Sprinklers, as it does the Cooling vats.
- The bonus of Field cap is rounded to the nearest Field tile, so that a Tier 1 Farm still gains one.
- The Motors of a Farm interior draw electricity from the city, as those of a Mill do.

## Considered options

- **Speed of growth of the Crops.** Rejected: growth is a rule of the whole city, not of a building.
- **A bonus on the share of the Harvest returned as Seed packs.** Rejected by the player in favour of the Field cap.
- **Seed stock capacity as a second capacity lever.** Rejected: it would blur the two circuits; only the Field cap moves.
- **The sum of the yields of all the Farms.** Rejected: it would reward stacking small Farms for a bonus that belongs to no Field.
- **A Line only, as in the Storehouse.** Rejected: too simple for the last interior of the chain.
- **A farmhand that only delivers a bonus, with a Harvest that stays a gesture.** First choice of this ADR, replaced: the Farm would have had nothing to automate. The farmhand now harvests one species by himself, at a Tier-bound rate, so that the gesture still pays when a crop ripens all at once. The Farm itself still produces nothing.
- **Instant harvest of every ripe Field.** Rejected: a single farmhand would clear the map the moment it ripens.

## Consequences

- `CONTEXT.md` gains Farm interior, Sprinkler, Washer, Thresher, Grader, Harvest bin, Farmhand and Irrigator.
- `interiors.json` and its schema gain the `farm` declaration; `fieldCap` and the Harvest yield read the Interior profile of the Farm, never its type.
- Fixtures, models (the Washer, Thresher, Grader, Harvest bin and Sprinkler are new, the skeleton reuses the models of the Factory and the Packhouse under the `farm*` prefix), three demonstrations, the codex entry and the Guide page come with the interior.
- The ADR stays `proposed` until the interior is balanced.
