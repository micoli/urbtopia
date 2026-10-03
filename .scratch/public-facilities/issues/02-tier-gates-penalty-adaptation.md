# 02: Tier gates, missing-service penalty and Adaptation period

**What to build:** Homes need the required Service coverage to upgrade, starting with the School for Tier 3. A Home whose current Tier requires a missing service loses Well-being. Cities loaded from older saves get an Adaptation period before these penalties apply.

**Blocked by:** 01

**Status:** done

- [ ] A required-services table per Home Tier exists; each requirement stays required for every higher Tier. This ticket fills only Tier 3 → School.
- [ ] A Home cannot upgrade to a Tier unless every service that Tier requires covers it; the Home panel shows the blocking reason.
- [ ] A Home whose current Tier requires a missing service loses 10 Well-being per missing service, capped at −40.
- [ ] Losing coverage, including through a capacity overflow after a neighbor's upgrade, never downgrades a Home.
- [ ] Loading a version 7 save keeps Home Tiers and starts an Adaptation period that suspends service penalties.
- [ ] Catch-up and Time skip respect the Adaptation period end.
