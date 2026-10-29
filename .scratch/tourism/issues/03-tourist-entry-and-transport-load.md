# Tourist entry points and transport load

Status: resolved
Spec: ../spec.md
Blocked by: 01

## What to build

Tourists enter by Railway stations and Transit hubs, else by road, and travel to Attractions on foot, as Riders or by car. Their trips load Crossings, stops and roads, and appear in the Building flows layer as a Tourists mode.

## Acceptance criteria

- [x] Entry choice and mode split tested on fixture maps with and without a station.
- [x] Congestion rises with Tourists by car; a station toward the Attractions lowers it.
- [x] Building flows lists Tourists for a tapped Attraction. Nothing Tourist-related is saved.
