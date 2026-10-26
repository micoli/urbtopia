# Analytics view balancing

Land value is a display-only indicator. Every constant below is in `LAND_VALUE` in `src/core/analytics/landValueField.ts`; nothing else in the game reads it.

For a Home standing on a tile:

`value = 100 × positive × (1 − maxNuisanceCut × nuisance)`

- `positive` (0 to 1) = 0.35 × Green space Well-being share + 0.30 × share of the seven Service categories whose facility reaches the tile (a facility without a radius covers the whole city, capacity is ignored) + 0.15 × Leisure share (1 − Leisure retention, saturating at 0.3) + 0.20 × access (a Road or Pedestrian way within 2 tiles counts for half, a transit stop within 6 tiles for the other half).
- `nuisance` (0 to 1) = 0.5 × Pollution malus over its cap + 0.3 × Odor malus over the Mound malus + 0.2 × Congestion within 3 tiles of the tile (the worst Road section, from ratio 1 to the maximum ratio).
- `maxNuisanceCut` = 0.6: the worst nuisance removes 60% of the value.

Only tiles of owned Parcels are read; the scale of the Layer is fixed at 0 to 100.
