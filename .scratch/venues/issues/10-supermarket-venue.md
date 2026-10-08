# 10: Supermarket Venue

**What to build:** A Supermarket Venue on the same scene and state shape as the Arcade, defined as data and rules: shelves, freezers and checkouts selling the player's Goods, with stock to manage.

**Blocked by:** 06, 07

**Status:** done

- [x] An entry in `assets/buildings.json` and a Fixture catalogue from the Mini Market pack (shelves, freezers, displays, checkout, carts, baskets, walls, floor, fence).
- [x] Visitors come from the neighbourhood like the Arcade; Takings come from selling Goods supplied from the Storehouse, so a shelf needs stock.
- [x] A shelf holds a given Good; an empty shelf earns nothing; restocking draws from the Storehouse at a cost.
- [x] Checkout capacity against Visitors sets the queue and the service rate.
- [x] Staff: manager, cashier, stocker, security; same wage and closure rules.
- [x] Wear, Repair and Tiers apply as in the Arcade (reuse, no new architecture).
- [x] The Supermarket is distinct from the Shop; Shops are not changed.
- [x] Balancing in `.scratch/venues/balancing.md`; FR/EN strings; Codex entry.

## Comments

- Rules in `src/core/venues/supermarket.ts` (`SUPERMARKET`). Shoppers: 0.3 per Citizen in reach and per hour. A checkout serves 20 shoppers per hour, scaled by the cashiers like the Arcade employees; with no checkout nothing sells. Each served shopper buys 3 units, split evenly over the stocked Shelves, at `value x (1 + 0.1 x markup step)`; the price step of ticket 03 is the markup step here, free to set only with a manager.
- A Shelf holds one Good and up to 8 to 20 units by model. Filling it costs a handling fee of 10% of the value of the units, paid in Urbs (by hand) or from the Takings (by a stocker, 8 units per stocker and hour). A different Good needs an empty Shelf.
- A Shelf running out of stock is a boundary of the Catch-up loop, so a long gap and small steps give the same Takings.
- Decor (cart, basket, bottle return) adds up to 15% attractiveness. Checkouts and Shelves wear slowly; there is no technician in a Supermarket, so Repair is by hand.
- The Shop is untouched. The exterior reuses `commercial/building-g`, shared with the high school.
- Not done: shelves do not draw from a particular Storehouse compartment, and the stock each Shelf sells is an even split, not weighted by demand.
