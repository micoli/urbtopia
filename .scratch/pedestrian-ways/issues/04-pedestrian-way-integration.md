# End-to-end balancing and compatibility

Status: claimed
Blocked by: 02, 03

## What to build

Verify the complete Pedestrian way feature across legacy saves, building placement, walking simulation, Crossing capacity and scene projection. Tune only if the agreed behavior is not achieved.

## Acceptance criteria

- [ ] Legacy cities without Pedestrian ways and newly saved cities load with identical existing Road behavior.
- [ ] A Home and eligible destination connected only by Pedestrian ways produce walking trips without car demand.
- [ ] A Pedestrian way joining a Road sidewalk can carry pedestrian trips; a Road crossing still requires an existing Crossing or dead end.
- [ ] Walking trips use the shortest combined network route and load only Crossings they traverse.
- [ ] No pedestrian capacity or vehicle traffic is assigned to Pedestrian way tiles.
- [ ] A representative connected city is inspected in the development scene.

## Comments
Core save compatibility, pedestrian routing, crossing loads and scene projection are implemented in tickets 01–03. Runtime checks and development-scene inspection remain open.
