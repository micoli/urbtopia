# Provision the Car Kit models

Type: task
Status: resolved
Blocked by:

## What to build

Make the 7 civilian Car Kit models available to the scene, with the same offline mechanism as the City Kits.

## Acceptance criteria

- [x] `assets/kenney/kenney_car-kit.zip` (Car Kit 3.1) is versioned.
- [x] A `cars` entry in `scripts/assetPacks.ts` lists the 7 models; `npm run assets` extracts them to `public/models/cars/` with their own colour map.
- [x] The scene declares the models (`src/scene/vehicleModels.ts`, included in `MODEL_KEYS`) so the asset tests pass in both directions.
- [x] The Car Kit is credited in the README.
- [x] `Vehicle` and `Traffic` are in `CONTEXT.md`.

## Answer

Done in commit `fc69ed2`.
