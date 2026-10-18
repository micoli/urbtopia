# Cyclist Rider on BRT, Railway and hubs

Type: task
Status: ready-for-agent
Blocked by: 04, 05

## What to build

Bicycles aboard BRT vehicles and Trains. See `../spec.md` and the Cyclist Rider term in `CONTEXT.md`.

## Seams under test

- Coverage: BRT stations, Railway stations and hubs cover up to 3 x `stopRadius`; bus stops keep 6.
- A Home between 6 and 18 tiles of a bike-carrying stop uses it as a Cyclist Rider, at both ends of the trip.
- Capacity: a cyclist takes 2 places per line used, a pedestrian 1.
- Itinerary of a Cyclist Rider has no bus leg, including through a hub.
- Riders are reported split into pedestrians and cyclists per line.

## Acceptance criteria

- [ ] Existing itinerary and capacity tests unchanged.
- [ ] Test: a Home 12 tiles from a rail station reaches an activity 12 tiles from another station; the same on a bus stop does not.
- [ ] Typecheck, lint and the full test suite pass.
