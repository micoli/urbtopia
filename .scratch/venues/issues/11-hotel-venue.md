# 11: Hotel Venue

**What to build:** A Hotel Venue on the same scene and state shape, with rooms by standing, housekeeping and a reputation that draws guests from outside the city.

**Blocked by:** 06, 07

**Status:** done

- [x] An entry in `assets/buildings.json` and a Fixture catalogue from the Furniture Kit (beds, bathrooms, sofas, lamps, rugs, desks, televisions, kitchen elements) with walls, floors and doorways.
- [x] Visitors come from outside the city, driven by the city's attractiveness (average Well-being, Culture, Casinos, Marina) and by the hotel's own reputation.
- [x] A room is a set of Fixtures; its standing sets the price and the guests it draws; incomplete rooms count for nothing.
- [x] Rooms need housekeeping by Staff; unclean rooms lower reputation. Staff: manager, receptionist, housekeeper, technician.
- [x] Reputation rises with quality and service and falls on breakdowns or closure; it is saved.
- [x] Wear, Repair, wages and Tiers apply as in the Arcade.
- [x] Balancing in `.scratch/venues/balancing.md`; FR/EN strings; Codex entry.

## Comments

- Rules in `src/core/venues/hotel.ts` (`HOTEL`). A bed is a Room when a bathroom piece is within 3 cells (a toilet or shower serves one Room, a bathtub two). Extras within 3 cells give comfort points: 2 for Standing 2, 4 for Standing 3. Rates per night 40 / 70 / 120 Urbs, +25% for a second guest, times `0.5 + 0.25 x level`; a night is 24 hours.
- Guest requests: 0.35 per hour x city attractiveness x `0.5 + Reputation / 100`, x price acceptance, x reception rate (a reception desk and receptionists; half speed without a desk). The city attractiveness counts casinos, marinas, theaters, concert halls, community halls, sport venues and parks (up to 6); the average Well-being named in the ticket is not used, to keep the model cheap.
- Housekeepers clean 10 Rooms a day each; unclean Rooms lower the target of the Reputation. The Reputation moves 5% toward its target each game hour, falls toward 0 while the Hotel is shut or closed, and is saved.
- Incomplete Rooms earn nothing and carry a hint in the interior. Beds and bathroom pieces wear slowly; the technician repairs them.
- The interior uses Furniture Kit walls and a floor; the exterior reuses `commercial/building-l`, shared with the university.
