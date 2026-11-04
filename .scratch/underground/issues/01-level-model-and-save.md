# Core: the Level model and its save entries

Status: resolved
Spec: ../spec.md

## What to build

The core knows three Levels over one grid, and the save keeps what is built on Level -1 and -2.

## Acceptance criteria

- [x] A Level type (surface, -1, -2) in the core, with no dependency on the scene or React.
- [x] Optional save entries for Underground walkways, Tunnels and Pedestrian accesses; a save without them loads as a city with no underground (persistence test on an old save).
- [x] One element per tile and per Level; nothing on a Level blocks another Level.
- [x] The Cloud save carries the same entries.
