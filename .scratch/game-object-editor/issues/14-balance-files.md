# Balance files

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

Singleton files under `assets/defs/balance/`: economy (`TAX`, `MARKET`, `SLOT_PRICES`, `PARCEL_PRICING`, `SHOP`), venues (`STAFF` wages and hiring fee, shared Venue constants, events), traffic (`ROAD_TIER_COSTS`). Editor "Balance" section with one form per file.

## Comments

Delivered (2026-10-10):

- `assets/defs/balance/economy.json` (tax, market, Slot prices, Parcel pricing, shops), `venues.json` (Staff wages and yields, shared Venue constants, events) and `traffic.json` (road tile cost by Tier), each validated by its own generated JSON Schema. Durations are in minutes in the files; `TAX`, `MARKET`, `SLOT_PRICES`, `PARCEL_PRICING`, `SHOP`, `STAFF`, `VENUE`, `EVENT` and `ROAD_TIER_COSTS` read them.
- The editor's settings section is now "Balance", one form per file (the pack formats stay there).
