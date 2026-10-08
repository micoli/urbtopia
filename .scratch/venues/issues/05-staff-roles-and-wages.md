# 05: Staff roles and wages

**What to build:** The player hires Staff for the Arcade by role. Each role fills a post, costs a daily wage and has a gameplay effect. Wages come out of Takings and an unpaid Venue closes.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Four roles: manager (one post, unlocks pricing and events, small yield bonus), employee (serves the counter, sets the service rate), technician (see ticket 06), security (prevents incidents that lose Visitors).
- [ ] Posts by Venue Tier; a post is filled by a Citizen like a Job and counts as one, so Commute and Jobs stay consistent; no named individuals.
- [ ] A hire has a daily wage in Urbs; wages are deducted from Takings at collection, never as a live debit.
- [ ] Without an employee the counter serves at a reduced rate; without a manager pricing is locked to a default.
- [ ] A Venue whose wages cannot be paid closes (earns nothing) and reopens when they can; no debt.
- [ ] Staff is saved by role; the Management view has a Staff section with posts, wages and hire or release.
- [ ] Tests cover the effects, the Jobs interaction and the closing rule.
