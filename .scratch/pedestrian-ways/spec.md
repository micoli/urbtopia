# Built Pedestrian ways

Status: ready-for-agent

Follow-up to [pedestrian-network](../pedestrian-network/spec.md). Vocabulary (**Pedestrian way**, **Pedestrian path**, **Sidewalk side**, **Walking trip**, **Crossing**, **Well-being**) is in `CONTEXT.md`. Respects [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md): pedestrian movement remains aggregate and deterministic; scene pedestrians remain a cosmetic projection.

## Problem Statement

The existing pedestrian network uses only the implicit Sidewalk sides of Roads. Players cannot build a pedestrian-only route or give a Home, School, Shop or Town hall an access that does not require a Road.

## Solution

Add player-built Pedestrian ways to the existing pedestrian graph. Ways connect to other ways and join a Road sidewalk at an endpoint. Pedestrian paths use the shortest route in the combined network and keep the existing Road crossing rules: a Crossing or a dead end is required to cross a Road. Pedestrian ways carry no Vehicles and have no pedestrian capacity limit. The Crossings used on a route continue to load and reduce the capacity of their Road tiles.

Homes, every School variant, Shops of every category, and the Town hall can be accessed by Road, Pedestrian way, or both. Other buildings retain their existing access requirements. Pedestrian-only access enables walking trips; destinations reachable on foot, including the Town hall, contribute to Well-being under the existing walking rules.

Pedestrian ways are available from the start. Building and upgrading one costs 90% of the corresponding Road build or upgrade.

## Settled Decisions

- A Pedestrian way connects to the Road sidewalk at its endpoint, not merely by lying beside a Road.
- Pedestrian ways connect to the Road-sidewalk pedestrian network and to one another; they do not connect to BRT.
- A Road can only be crossed at a Crossing or around a dead end, as in the existing pedestrian graph.
- Pedestrian traffic follows the shortest route through the combined network. There is no capacity limit on Pedestrian ways.
- Pedestrian ways are pedestrian-only. Only Crossings used by pedestrians affect Road capacity.
- Homes, Schools (all variants), Shops (all categories) and the Town hall may have Road access, Pedestrian way access, or both. Every other building retains its current access rules.
- Town halls count as walking destinations and can contribute to the existing Well-being bonus for accessible destinations.
- Pedestrian ways are available from the beginning and their construction and upgrades cost 90% of the corresponding Road cost.

## Implementation Notes

- Extend the existing pedestrian graph and pathfinding rather than creating a separate pedestrian traffic model.
- Keep walking trips and Crossing loads derived from city layout and existing aggregate walking demand.
- Preserve deterministic results during simulation and catch-up.
- No individual Citizen journeys are introduced.

## Tickets

1. [Core Pedestrian way construction, upgrades and removal](issues/01-pedestrian-way-commands.md)
2. [Pedestrian graph, building access and walking destinations](issues/02-pedestrian-network-and-access.md) (blocked by 01)
3. [Build tools, costs and map presentation](issues/03-pedestrian-way-ui.md) (blocked by 01)
4. [End-to-end balancing and compatibility](issues/04-pedestrian-way-integration.md) (blocked by 02, 03)

Order: 01 → 02 and 03 → 04.

## Source

Decisions were settled in a grilling session on 2026-10-17. See the pedestrian-network spec for the existing walking thresholds, service trip weights, Well-being formula and Crossing capacity parameters.
