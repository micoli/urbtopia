# Pedestrian graph, building access and walking destinations

Status: resolved
Blocked by: 01

## What to build

Extend the existing pedestrian graph to include built Pedestrian ways, allow the agreed buildings to use them for access, and count Town halls as walking destinations.

## Acceptance criteria

- [x] Pedestrian ways connect to one another and to Road sidewalks only at their endpoints.
- [x] A Pedestrian way endpoint joins the Road sidewalk; merely lying beside a Road does not connect it.
- [x] Pathfinding uses the shortest route over the combined Sidewalk and Pedestrian way graph.
- [x] Roads remain crossable only at a Crossing or around a dead end; used Crossings keep their existing pedestrian load and capacity effect.
- [x] Homes, every School variant, every Shop category and the Town hall accept Road access, Pedestrian way access, or both; other buildings retain their existing access modes.
- [x] Removing the last Pedestrian way access of a building with no other valid access is refused.
- [x] A Pedestrian-way-only Home can reach eligible work and service destinations over the same aggregate walking model.
- [x] Town halls are eligible Walking trip destinations and contribute to the existing Well-being access bonus.

## Comments
