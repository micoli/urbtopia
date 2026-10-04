# 02: Casino Tiers

**What to build:** The player can upgrade a Casino to Tier 2 and Tier 3 with Urbs. Tiers raise the maximum Stake, power Demand, Well-being radius and decide which Minigames the Casino offers.

**Blocked by:** 01

**Status:** done

- [ ] Tier 2 uses `2Story_Wide_Mat`, Tier 3 uses `2Story_Wide_2Doors_Mat`; the footprint grows from 2×2 to 3×2 to 6×2 (depth 2, anchored on the original tile), model fitted to the width.
- [ ] An upgrade whose extra tiles are occupied or outside owned Parcels is refused with the existing placement error, and the panel says free space is needed.
- [ ] Upgrade costs 4 000 Urbs (Tier 1 to 2) then 8 000 (Tier 2 to 3), from the Casino panel.
- [ ] Max Stake is 100 / 500 / 2 000 by Tier.
- [ ] Power Demand is 3× a theater at Tier 1, +50% per Tier.
- [ ] Well-being radius is 8 / 10 / 12 by Tier.
- [ ] A Casino offers every Minigame of its Tier and below; Minigames above its Tier are shown locked with the required Tier.
- [ ] Upgrading a shut Casino is allowed; upgrade keeps the Casino's position and anchor tile.
- [ ] Casino panel shows the Tier, next upgrade cost and what it unlocks.
- [ ] Tests cover Tier scaling of Demand, radius and Stake cap; Codex entry mentions Tiers; FR/EN strings.
