# Pedestrian graph, building access and walking destinations

Status: ready-for-agent
Blocked by: 01

## What to build

Extend the existing pedestrian graph to include built Pedestrian ways, allow the agreed buildings to use them for access, and count Town halls as walking destinations.

## Acceptance criteria

- [ ] Pedestrian ways connect to one another and to Road sidewalks only at their endpoints.
- [ ] Pathfinding uses the shortest route over the combined Sidewalk and Pedestrian way graph.
- [ ] Roads remain crossable only at a Crossing or around a dead end; used Crossings keep their existing pedestrian load and capacity effect.
- [ ] Homes, every School variant, every Shop category and the Town hall accept Road access, Pedestrian way access, or both; other buildings retain their existing access modes.
- [ ] Removing the last Pedestrian way access of a building with no other valid access is refused.
- [ ] A Pedestrian-way-only Home can reach eligible work and service destinations over the same aggregate walking model.
- [ ] Town halls are eligible Walking trip destinations and contribute to the existing Well-being access bonus.
- [ ] Tests cover path connectivity, crossing restrictions, building access, Town hall destinations, shortest route and deterministic walking/Crossing counts.

## Comments
