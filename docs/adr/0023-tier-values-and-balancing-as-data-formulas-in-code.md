# Tier values and balancing are data, formulas stay in code

Accepted. Amends [ADR 0004](0004-three-unique-storages-and-generic-tier.md) and reverses the line of [ADR 0014](0014-all-buildings-defined-in-buildings-json.md) that kept "Tier costs, capacities, production, service radii, energy" in code.

The numbers that change from one Tier to the next (model, footprint, upgrade cost in Urbs and Goods, Citizens, Jobs, Slots, capacity, power and water Demand, radius, Well-being bonus, Venue grid size and Staff posts…) move from the tables of `src/core` (`HOME_TIERS`, `PRODUCTION_TIERS`, `STORAGE_TIERS`, `CASINO`, `MARINA_TIERS`, `FACILITY_TIER_CAPACITY`, `HOME_MODELS`…) into a `tiers` array in the Game object's file. Game-wide constants (`TAX`, `MARKET`, `SLOT_PRICES`, `PARCEL_PRICING`, Staff wages, road Tier costs, Rank thresholds) move to singleton Balance files. The formulas that use them stay in code, keyed by kind.

- **Explicit values, inherited.** `tiers[0]` is Tier 1; a Tier inherits every field it does not set from the previous one. Today's formulas (`base + perTier` capacities, `casinoPower` growth, the facility capacity multiplier) are unfolded into explicit values, so what a designer reads is what the game uses. The number of Tiers is the length of the array; the `MAX_*_TIER` constants disappear.
- **Unlocks stay on the unlocked object.** "Available from Tier N" is `minTier` (and `minRank`) on the Fixture, Material, Good or Minigame; the editor shows the reverse view on each Tier, read-only.
- **Variants are visual.** A named variant (`solar` for a Home) overrides the model, footprint or recolor per Tier; what activates it stays a rule in code.

Rejected: a generic bag of stats per Tier (validates nothing), full Tiers with no inheritance (eight copies of every Home field), declarative rules in JSON (a rules language to maintain).
