# 02: Waste buildings, Well-being, Sanction and Vital Need

**What to build:** The Mound, Incinerator and Recycling plant exist as building definitions with placeholder models, unlock at 800, 1000 and 1500 Citizens, and their effects reach Well-being, Pollution, Climate, Sanction and the Vital Need level.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Three files in `assets/defs/buildings` with Tiers (Mound 3, Incinerator 4, Recycling plant 4), costs, upgrade costs and capacities from the spec; schemas generated and valid (ADR 0021).
- [ ] Mound: 1×1, `requiresRoad`, Odor radius separate from collection reach; Well-being malus is the worst Mound around a Home, never summed; no Climate.
- [ ] Incinerator: local malus weaker than coal, Climate emissions proportional to Waste burnt.
- [ ] Recycling plant: power Demand per Tier, shed on shortage like any economic building, no malus, no emissions.
- [ ] Missing Waste coverage lowers Well-being and can block Home Tier upgrades.
- [ ] Waste feeds the Vital Need level and is sanctioned from Easy; odor and pollution join the Pollution factor at Medium. Cozy has no Sanction.
- [ ] Unlock notifications at 800, 1000 and 1500 Citizens; build menu entries under Public facilities.
- [ ] Placeholder models (boxes); old saves load with none of the new buildings.
- [ ] Usage-cost tariffs calibrated on the real Tax per Citizen (about 10 to 20 % of Tax at Medium).
