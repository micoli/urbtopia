# 03: Arcade revenue model and price

**What to build:** Takings follow the real pipeline: Visitors from the neighbourhood, limited by the Fixtures and a service rate, with a price the player can set. The panel shows what each Fixture earns per day.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Visitors derive from the Citizens within reach of the Arcade (distance, Road or BRT access, Walking trip range) and from its attractiveness.
- [ ] Takings = `Visitors x service rate x price`, where the service rate is limited by the number of Fixtures and the counter.
- [ ] The player sets the price of a play within bounds; too high lowers accepted Visitors, too low lowers Takings. Pricing is available only with a Manager once Staff exists, free to set before that.
- [ ] The Management view shows per-Fixture daily earnings and the Venue total.
- [ ] Takings are collected by hand, capped by the Venue Tier, with the same collect gesture as Tax.
- [ ] The model is a pure function of the state and the clock; unit tests cover Visitors, service rate, price elasticity and the cap; Catch-up of 48 h gives the same result as ticking.
- [ ] Balancing values go in `.scratch/venues/balancing.md`.
