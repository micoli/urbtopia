# End-to-end balancing and compatibility

Status: ready-for-agent
Blocked by: 02, 03

## What to build

Verify the complete Pedestrian way feature across legacy saves, building placement, walking simulation, Crossing capacity and scene projection. Tune only if the agreed behavior is not achieved.

## Acceptance criteria

- [ ] Legacy cities without Pedestrian ways and newly saved cities load with identical existing Road behavior.
- [ ] A Home and eligible destination connected only by Pedestrian ways produce walking trips without car demand.
- [ ] A Pedestrian way joining a Road sidewalk can carry pedestrian trips; a Road crossing still requires an existing Crossing or dead end.
- [ ] Walking trips use the shortest combined network route and load only Crossings they traverse.
- [ ] No pedestrian capacity or vehicle traffic is assigned to Pedestrian way tiles.
- [ ] Focused core and UI tests pass; a representative connected city is inspected in the development scene.

## Comments
