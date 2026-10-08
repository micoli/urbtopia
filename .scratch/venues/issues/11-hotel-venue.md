# 11: Hotel Venue

**What to build:** A Hotel Venue on the same scene and state shape, with rooms by standing, housekeeping and a reputation that draws guests from outside the city.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] An entry in `assets/buildings.json` and a Fixture catalogue from the Furniture Kit (beds, bathrooms, sofas, lamps, rugs, desks, televisions, kitchen elements) with walls, floors and doorways.
- [ ] Visitors come from outside the city, driven by the city's attractiveness (average Well-being, Culture, Casinos, Marina) and by the hotel's own reputation.
- [ ] A room is a set of Fixtures; its standing sets the price and the guests it draws; incomplete rooms count for nothing.
- [ ] Rooms need housekeeping by Staff; unclean rooms lower reputation. Staff: manager, receptionist, housekeeper, technician.
- [ ] Reputation rises with quality and service and falls on breakdowns or closure; it is saved.
- [ ] Wear, Repair, wages and Tiers apply as in the Arcade.
- [ ] Balancing in `.scratch/venues/balancing.md`; FR/EN strings; Codex entry.
