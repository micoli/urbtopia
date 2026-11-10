# Home interior

Status: done

Decisions from the grilling session. Vocabulary in `CONTEXT.md` (Home interior, Comfort, Fixture, Management view). Rationale in ADR-0066.

## Rules
- Every Home (8 Tiers and regional Styles) can open a Home interior from its side panel ("Furnish"). It is one sample dwelling; its Comfort applies to the whole Home whatever its Citizens.
- Not a Venue: no Staff, Jobs, Takings, Visitors, Rank, events, Technician, Condition or Repair. An empty interior leaves the Home exactly as it is.
- Grid grows with the Tier of the Home. Walls are full height and always present.
- Fixtures: `venue: "home"`, one file per Fixture in `assets/defs/fixtures/`, same models as the Venue ones when they exist (chair, stove, beds, bathroom pieces, armchair); Venue catalogues and prices do not move. Categories reused: beds, bathroom, kitchen, dining, comfort, shelves, decor.
- New models: sink on cabinet, old cathodic television on cabinet, bookcase, coffee table, wall paintings (all text on models in English). New Fixtures of 1x1 for composed pieces, never stacked.
- Wall-mounted Fixture (painting): on a wall segment of the two back walls, one per segment, no floor tile.
- Floor: setting of the Home, four free parquets, no effect on Comfort, first by default.
- Comfort 0-100 by coverage: sleeping 25, washing 20, eating 15, cooking 15, leisure 15, decor 10 (diminishing returns). Eating needs a table with a chair next to it; cooking needs stove and sink (half each); washing needs a bathroom piece set like a Hotel Room. Weights in `assets/defs/balance/`.
- Well-being: Comfort adds +5 points at Tier 1 up to +12 at Tier 8 (data), never a malus. Detail line "Comfort +X".
- Price one-off in Urbs, no upkeep, 50 % refund on removal.
- Saved: per Home Fixtures (type, position, rotation, wall face) and parquet. Old saves load with an empty interior; Tier upgrade keeps Fixtures; demolition drops the interior. Save version bump and migration.
- Furnishing opens at 700 Citizens in the city.
- UI: "Furnish" button, Comfort bar in the side panel and in the Management view. No forced objective, tutorial or notification.

## Delivery order
1. Engine, Comfort, save, UI with the existing models.
2. Wall-mounted Fixtures and paintings.
3. New Blender models.
4. Parquets.
