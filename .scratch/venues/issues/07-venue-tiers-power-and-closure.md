# 07: Venue Tiers, power and shedding

**What to build:** An Arcade has Tiers that grow the interior grid, the Staff posts and the Takings cap. It consumes moderate power, is shed after the Casino, and is protected during an Adaptation period.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Tier 1 / 2 / 3 grids are 6x6 / 8x8 / 10x10; upgrading keeps existing Fixtures in place and reveals the new cells.
- [ ] Upgrades cost Urbs; the outside footprint grows if the model requires it, following the free-space rule used by the Casino (refused with the placement error, panel says free space is needed).
- [ ] Staff posts and the Takings cap rise with the Tier; Fixtures have minimum Tiers.
- [ ] Power Demand is moderate; the Arcade is shed after the Casino and before Homes' last margin, and not shed during an Adaptation period; unpowered it earns nothing.
- [ ] The side panel shows the Tier, the next upgrade cost, what it unlocks and the powered or shut state.
- [ ] Tests cover Tier scaling, shedding order and the Adaptation exemption.
