# 01: School end to end

**What to build:** The player can build a School once the city reaches 15 Citizens. The School covers nearby Homes within its radius and up to its Citizen capacity, nearest Homes first. Covered Homes gain Well-being, and Well-being now has a stronger effect on Tax. The Home panel shows which services cover the Home.

**Blocked by:** None (can start immediately)

**Status:** done

- [ ] School is constructible from a new "Public facilities" build-menu section grouped by Service category; it locks below 15 Citizens.
- [ ] School costs 300 Urbs, occupies 2×2, has no Tier, no operating cost, and electricity Demand comparable to a Tier 2 Home.
- [ ] School uses a reused Kenney kit building tinted for Education, with a distinctive detail.
- [ ] Service coverage: Homes within Manhattan radius 8 are served nearest first until 200 Citizens of capacity are used; farther Homes are not covered.
- [ ] A covered Home gains +10 Well-being for Education, with diminishing returns and the existing 100-point limit; Green space and coal pollution effects are unchanged.
- [ ] Tax multiplier becomes `1 + Well-being / 500`; balance tests are updated.
- [ ] Home panel lists covered services.
- [ ] One Codex entry for the School with FR/EN name and description.
- [ ] A notification announces the School Unlock.
- [ ] Save version 8 accepts the School; version 7 saves load unchanged.
