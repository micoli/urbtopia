# Technician, wear and Repair

Status: resolved
Blocked by: 02

## Answer

- Wear: what runs wears by the hour (`floorUsageOf`: Fixtures that carry Drive, linked Machines, and the Pumps and Pipes whose Flow reaches a linked Machine). The rate is `usagePerHour` in `assets/defs/balance/factoryFloor.json`, times the Fixture's `wear`; an idle Fixture does not wear, and a Factory with no power runs nothing.
- Breakdowns: at an hour boundary a worn Fixture below 40 % may break, drawn from the floor's own stream of the Seed (`floor.rng`), so reloading never dodges it and Catch-up replays it. A broken Fixture is left out of the Links, so what lies downstream stops.
- Repair: `RepairFloorFixture`, paid in Urbs, cheaper than buying again (same rule as a Venue).
- Technician: `HireFloorTechnician` and `ReleaseFloorTechnician`, one from Tier 3 and two at Tier 5 (`technicianPosts`), hire fee and daily wage of the Venue Technician. He repairs by himself at each hour boundary, at a lower price, and slows the wear. His wage comes out of the Urbs of the city by the hour; with no Urbs left he does not work.
- Departure from ADR-0064: the Fill rate of ADR-0061 does not apply to the Technician for now; a hired Technician always works. The Factory's Jobs do not count him. To do if the balance asks for it.
- `advance` now lets a floor change the Urbs of the city (wages and repairs); before, only the Takings of a Venue moved.
