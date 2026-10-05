# Vehicle traffic

Ecological city update: electricity allocation and transport behavior are superseded by [ADR 0005](../../docs/adr/0005-local-energy-and-coverage-based-mobility.md); historical MVP decisions below are retained for context.
Traffic becomes a game mechanic in [traffic-congestion](../traffic-congestion/spec.md), superseding the "cosmetic only" decision below.
Add the Kenney Car Kit vehicle models, then show Vehicles driving on the roads, with the Traffic size following the city's total Citizens. Agreed in a grilling session on 2026-10-03; vocabulary (**Vehicle**, **Traffic**) is in `CONTEXT.md`.

## Decisions

- **Cosmetic only**: Traffic lives in `src/scene/`. Nothing in the core, the save or the catch-up; Vehicles start from scratch on reload. No ADR needed.
- **Size**: 1 Vehicle per 10 Citizens, at most 150 (halved on touch screens), and at most 1 per 2 road tiles.
- **Movement**: random walk on the road graph. Straight on when possible, otherwise a random exit; U-turn at a dead end. A crossing is crossed like a plain road tile. A roundabout is a ring of its 8 outer tiles, centre excluded. Isolated road tiles host no Vehicle.
- **Lane and speed**: right-hand lane with a fixed lateral offset, no collisions, about 2 tiles per second with ±20% per Vehicle, independent of game time.
- **Spawn and despawn**: spawn on a random road tile, out of view when possible. Surplus Vehicles are removed where they are, out of view first. A Vehicle whose road is demolished is removed. A loaded game starts with full Traffic.
- **Rendering**: one `InstancedMesh` per vehicle model, rigid body (wheels do not turn), uniform scale 0.25, no shadows.
- **Models**: `sedan`, `sedan-sports`, `hatchback-sports`, `suv`, `suv-luxury`, `taxi`, `van`, picked at random with the game seed. No emergency vehicles, no trucks.
- **Assets**: `cars` pack in `scripts/assetPacks.ts`, archive `assets/kenney/kenney_car-kit.zip` (Car Kit 3.1, CC0), extracted to `public/models/cars/` (its colour map differs from the City Kits').
- **Preference**: a "Traffic" switch in the preferences, on by default, with FR/EN labels.
- **Tests**: pure modules without `three` (target count, road graph and next-tile choice, injected random), tested with Vitest. Rendering is checked by eye.

## Tickets

1. [Provision the Car Kit models](issues/01-provision-car-kit-models.md)
2. [Show Traffic that follows the population](issues/02-show-traffic.md)
