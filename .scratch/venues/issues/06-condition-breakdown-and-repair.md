# 06: Condition, breakdowns and Repair

**What to build:** Fixtures wear with use and break down; the player repairs them for Urbs, or a Technician does. Nothing is discarded for wear.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Each Fixture has a Condition that falls per tick with the Venue's attendance; a technician slows the wear.
- [ ] Below a threshold a Fixture breaks down, drawn from a dedicated Seed stream of the Venue (ADR 0010); a broken Fixture stops earning.
- [ ] The player repairs a Fixture from the Management view for Urbs; a Repair always costs less than buying the Fixture again.
- [ ] A technician repairs broken Fixtures over time, at a lower cost than a manual Repair.
- [ ] Condition and the PRNG stream are saved; reloading after a breakdown never dodges it.
- [ ] Broken Fixtures are visibly marked in the interior.
- [ ] Tests cover wear, breakdown determinism from the Seed, Repair cost vs purchase price, and the technician.
