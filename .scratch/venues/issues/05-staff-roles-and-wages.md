# 05: Staff roles and wages

**What to build:** The player hires Staff for the Arcade by role. Each role fills a post, costs a daily wage and has a gameplay effect. Wages come out of Takings and an unpaid Venue closes.

**Blocked by:** 03

**Status:** done

- [x] Four roles: manager (one post, unlocks pricing and events, small yield bonus), employee (serves the counter, sets the service rate), technician (see ticket 06), security (prevents incidents that lose Visitors).
- [x] Posts by Venue Tier; a post is filled by a Citizen like a Job and counts as one, so Commute and Jobs stay consistent; no named individuals.
- [x] A hire has a daily wage in Urbs; wages are deducted from Takings at collection, never as a live debit.
- [x] Without an employee the counter serves at a reduced rate; without a manager pricing is locked to a default.
- [x] A Venue whose wages cannot be paid closes (earns nothing) and reopens when they can; no debt.
- [x] Staff is saved by role; the Management view has a Staff section with posts, wages and hire or release.
- [x] Tests cover the effects, the Jobs interaction and the closing rule.

## Comments

- Rules in `src/core/venues/staff.ts` (`STAFF`). Posts by Tier: manager 1, employee 2/3/4, technician 1/1/2, security 1/1/2 (only Tier 1 exists until ticket 07). Wages per day: 60, 30, 40, 35 Urbs.
- Employee rate `min(1, 0.4 + 0.3 x employees)`; manager yield +10%; no security loses 10% of Visitors. Technician effect comes with ticket 06; the manager's events with ticket 08.
- Closing is derived, not saved: closed when the Takings are 0 and gross earnings cannot cover the wages. It reopens as soon as wages are lowered or earnings rise. Takings never go below 0.
- The Arcade offers one Job per hired Staff member.
