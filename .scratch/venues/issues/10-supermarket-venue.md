# 10: Supermarket Venue

**What to build:** A Supermarket Venue on the same scene and state shape as the Arcade, defined as data and rules: shelves, freezers and checkouts selling the player's Goods, with stock to manage.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] An entry in `assets/buildings.json` and a Fixture catalogue from the Mini Market pack (shelves, freezers, displays, checkout, carts, baskets, walls, floor, fence).
- [ ] Visitors come from the neighbourhood like the Arcade; Takings come from selling Goods supplied from the Storehouse, so a shelf needs stock.
- [ ] A shelf holds a given Good; an empty shelf earns nothing; restocking draws from the Storehouse at a cost.
- [ ] Checkout capacity against Visitors sets the queue and the service rate.
- [ ] Staff: manager, cashier, stocker, security; same wage and closure rules.
- [ ] Wear, Repair and Tiers apply as in the Arcade (reuse, no new architecture).
- [ ] The Supermarket is distinct from the Shop; Shops are not changed.
- [ ] Balancing in `.scratch/venues/balancing.md`; FR/EN strings; Codex entry.
