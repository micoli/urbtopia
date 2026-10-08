# 06: Condition, breakdowns and Repair

**What to build:** Fixtures wear with use and break down; the player repairs them for Urbs, or a Technician does. Nothing is discarded for wear.

**Blocked by:** 05

**Status:** done

- [x] Each Fixture has a Condition that falls per tick with the Venue's attendance; a technician slows the wear.
- [x] Below a threshold a Fixture breaks down, drawn from a dedicated Seed stream of the Venue (ADR 0010); a broken Fixture stops earning.
- [x] The player repairs a Fixture from the Management view for Urbs; a Repair always costs less than buying the Fixture again.
- [x] A technician repairs broken Fixtures over time, at a lower cost than a manual Repair.
- [x] Condition and the PRNG stream are saved; reloading after a breakdown never dodges it.
- [x] Broken Fixtures are visibly marked in the interior.
- [x] Tests cover wear, breakdown determinism from the Seed, Repair cost vs purchase price, and the technician.

## Comments

- Rules in `src/core/venues/wear.ts` (`WEAR`). Wear is `0.5 x plays served per hour` points per hour (x0.6 with a technician). Breakdowns are drawn at each game-hour boundary below Condition 40, with a chance up to 50% per hour, from a per-Venue stream (`venue.rng`, seeded from the game Seed and the building id) saved with the Venue.
- A manual Repair costs `0.6 x price x damage`; a technician repairs one Fixture per technician and hour, at 60% of that, from the Takings. Broken Fixtures stay out of capacity, noise and seating.
- Broken Fixtures are marked red in the interior, noisy or misplaced ones orange.
