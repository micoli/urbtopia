# 07: Venue Tiers, power and shedding

**What to build:** An Arcade has Tiers that grow the interior grid, the Staff posts and the Takings cap. It consumes moderate power, is shed after the Casino, and is protected during an Adaptation period.

**Blocked by:** 05

**Status:** done

- [x] Tier 1 / 2 / 3 grids are 6x6 / 8x8 / 10x10; upgrading keeps existing Fixtures in place and reveals the new cells.
- [x] Upgrades cost Urbs; the outside footprint grows if the model requires it, following the free-space rule used by the Casino (refused with the placement error, panel says free space is needed).
- [x] Staff posts and the Takings cap rise with the Tier; Fixtures have minimum Tiers.
- [x] Power Demand is moderate; the Arcade is shed after the Casino and before Homes' last margin, and not shed during an Adaptation period; unpowered it earns nothing.
- [x] The side panel shows the Tier, the next upgrade cost, what it unlocks and the powered or shut state.
- [x] Tests cover Tier scaling, shedding order and the Adaptation exemption.

## Comments

- Upgrade costs 2500 then 6000 Urbs through the usual `UpgradeBuilding`. The outside footprint stays 2x2 at every Tier (the model does not need to grow), so no free-space rule applies. The entrance stays on the same cell of the north wall (3, 0) so a bigger grid never moves it under a Fixture.
- Power Demand is 1.5 per Tier. The Arcade is supplied after the Homes, the economic buildings and transit, and before the Casino (checked in `venues.test.ts`). Unpowered it earns nothing, pays no wages and does not wear; an Adaptation period keeps it open.
- The Codex page lists the interior size, posts, Takings cap, power and Fixtures by Tier.
