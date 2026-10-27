# Pedestrian Footbridge

Status: needs-triage

Follow-up to [pedestrian-network](../pedestrian-network/spec.md), [pedestrian-ways](../pedestrian-ways/spec.md) and [bridges](../bridges/spec.md). Vocabulary (**Crossing**, **Pedestrian way**, **Pedestrian path**, **Sidewalk side**, **Bridge**, **Bridge span**, **Bridge ramp**, **Carrier**, **Congestion**) is in `CONTEXT.md`. Respects [ADR 0011](../../docs/adr/0011-congestion-as-core-model-with-visual-vehicles.md) (aggregate core, cosmetic scene), [ADR 0043](../../docs/adr/0043-bridges-over-infrastructure.md) and [ADR 0046](../../docs/adr/0046-street-view-walks-the-pedestrian-graph.md).

## Problem Statement

A Road is crossed on foot only at a Crossing or around a dead end, and every pedestrian using a Crossing cuts the capacity of its Road tile (`crossingCut`, up to 60%). On a busy road the player who wants a walkable neighbourhood and a flowing road has only two remedies: move the Crossing away, or replace the junction with a Roundabout. Pedestrian ways cannot cross a Road at all, so they cannot help.

## Solution

A **Footbridge**: a Bridge over infrastructure whose Carrier is the pedestrian network. It starts from a Sidewalk with a short corridor and a small staircase turned 90° (running along the road), crosses on a raised deck of 1, 2, 3 or 5 tiles above at least one Road, BRT corridor or Railway tile, then comes down by a second 90° staircase and corridor onto the Sidewalk on the other side. Its footprint is 2 tiles wide and `span + 2` long: 2×3 to cross one lane, 2×4 for two, 2×5 for three, 2×7 for five. Pedestrians (and cyclists, who share the Pedestrian path network) cross over the road without touching it: a Footbridge adds no pedestrian load to any Road tile, so it never cuts capacity. It is the same structure as the existing Bridges over infrastructure, with a new Carrier, so placement, demolition protection, saving and rendering reuse that machinery.

The shortest-route rule does not change. The player relieves a road by building a Footbridge and demolishing the Crossing it replaces; pedestrians then route over the Footbridge, at the price of a longer walk.

## User Stories

1. As a player, I want to build a Footbridge over a Road, so that pedestrians cross it without slowing cars.
2. As a player, I want a Footbridge over a Railway or a BRT corridor, so that pedestrians can cross infrastructure that has no Crossing.
3. As a player, I want a Footbridge to join my Pedestrian ways and Road sidewalks at both ends, so that it is part of the Pedestrian path network.
4. As a player, I want a Footbridge to load no Road tile, so that a busy road regains its full capacity once its Crossing is replaced.
5. As a player, I want pedestrians to take the Footbridge when the Crossing is gone, so that the Walking trips across the road still happen.
6. As a player, I want walking across a Footbridge to cost more than a Crossing, so that a Footbridge is worth building only where the road matters.
7. As a player, I want a Footbridge to be refused where it cannot work (no infrastructure under the span, building under it, ramp not on free land, an end not connected), with the reason on the ghost, so that I understand why.
8. As a player, I want demolishing the last infrastructure tile under a Footbridge span to be refused, so that I never leave a bridge over nothing.
9. As a player, I want a Footbridge to give no access to buildings and no exit on its span or ramps, so that it behaves as a bridge.
10. As a player, I want a refund when I remove a Footbridge, as for other Bridges.
11. As a player, I want the Analytics pedestrian layer to show the Crossing load drop after a Footbridge replaces it, so that I see the effect.
12. As a player, I want scene pedestrians and the Street view to walk up and over the Footbridge, so that it looks and feels right.
13. As a player, I want FR/EN labels for every new element, so that it matches the rest of the UI.
14. As a maintainer, I want the price, unlock and walking cost in the balancing document, so that they can be tuned without changing rules.
15. As a maintainer, I want old saves to load unchanged, so that no migration is needed.

## Implementation Decisions

- **Model.** `Bridge.carrier` gains the value `'pedestrian'` (`src/core/engine/state.ts`). Geometry (`bridgeTiles`, `bridgeRamps`, `bridgeFootprint`, `bridgeEnds`) is reused as is. No tier. Glossary: **Carrier** now includes the pedestrian network; **Footbridge** is added; the rule "A Railway is never a Carrier" is unchanged.
- **Footprint.** A 2-wide rectangle of `span + 2` tiles along the crossing axis. The two end rows (staircase and corridor, one tile each of the 2-wide row) stand on free land; the `span` middle rows are the deck. The 90° turn of the staircases is why the footprint is 2 wide: the stairs run along the road, the deck crosses it. The footprint, not `bridgeFootprint`'s 1-wide line, is what `Bridge` geometry must return for this Carrier (`bridgeTiles`, `bridgeRamps` and `bridgeEnds` get a width-aware variant; the existing Carriers stay 1 wide).
- **Placement rules** (as the Road Bridge, in `bridges.ts`): under the deck rows at least one Road, BRT or Railway tile, the rest free land; end rows on free land; nothing underneath but infrastructure and free land (no building, Field, Pedestrian way, Roundabout or other Bridge). Each corridor must touch the pedestrian network: a Pedestrian way tile, or a Road tile whose Sidewalk side facing the corridor is free. Both ends are required.
- **Pedestrian graph** (`pedestrianGraph.ts`). The two corridor tiles use the Pedestrian way node (`:P`). They are linked by one edge of cost `span + 3` (two staircases at 1 each, the deck, and the walk from corridor to staircase), with no `crossing` field, so `crossingCut` never sees it. Staircase and deck tiles carry no node. Each corridor links only to its outer neighbour along the crossing axis, never sideways, so a Road running beside the footprint gets no access. The existing Crossing edge (`1 + crossingExtraCost`) is unchanged.
- **No other network effect.** The Footbridge is absent from the Road, BRT and Railway graphs and from Congestion, Commute and building access (`roadGraph.ts`, `transitNetwork.ts`, `occupancy.ts` must skip the new Carrier).
- **Cost and unlock.** Price from a table per span length, ramps included, starting at the Road Bridge price times a coefficient (start 0.6), same unlock as other Bridges (120 Citizens), usual `sellRefundRatio` refund. Values in `balancing.md` (to write), set from headless autoplayer measurements.
- **Tool.** The Bridge flyout (`BridgeTools.tsx`, `tools.ts`, `commands.ts`) gets a third Carrier choice. Same rotating ghost, green when valid, red with the reason otherwise.
- **Scene.** New models needed (the Kenney ramp and span do not fit): corridor, 90° staircase and deck with railings, built in Blender like the other managed models. Scene pedestrians and the Street view (ADR 0046) follow the graph path; the height is rendering only and the core never reads it.
- **Save.** Optional `carrier: 'pedestrian'` on `bridges` entries; update the schema in `src/persistence/validate.ts` and the Cloud save validation if it checks the value. No migration (ADR 0003).
- **Guide.** Update `mobility.fr.mdx` (and the EN page) and the Crossing entry: a Footbridge is the third remedy for a Crossing that chokes a road.

## Testing Decisions

A good test checks external behaviour: given a city, what path, load and capacity result.

- **Seam 1 (core, pedestrian graph and congestion):** a Home and a Shop on either side of a Road reach each other over a Footbridge when no Crossing exists; the Road tile under the span has no `crossing` entry and keeps full capacity; with both a Crossing and a Footbridge the cheaper route wins deterministically; a Footbridge over a Railway joins the two sides; no sideways access from a ramp; cyclists use it. Prior art: `pedestrianGraph` tests, `congestion.test.ts`, `pedestrianFields.test.ts`.
- **Seam 2 (core, placement):** refusals with reason (no infrastructure under, building under, ramp on non-free tile, end not connected, other Bridge under); demolition of the last tile under a span refused; price, unlock and refund. Prior art: `infrastructureBridges.test.ts`.
- **Seam 3 (persistence):** an old save loads unchanged; a save with a Footbridge round-trips locally and through Cloud validation. Prior art: persistence tests around `validate.ts`.
- **Seam 4 (interface):** the flyout shows the new Carrier, the ghost reason and FR/EN labels. Prior art: `BridgeTools` stories and tests.
- Rendering and Street view checked by eye in the dev server.

## Out of Scope

- Underpasses (pedestrian tunnels). They would behave in the graph exactly as the Footbridge and can reuse the same Carrier with a different model; the placement rules differ (nothing above, tunnel under the infrastructure), so they are a follow-up.
- Footbridges over water, over Pedestrian ways, stacked or curved Footbridges, stairs or lifts.
- Pedestrian capacity limits or speed on a Footbridge.
- Automatic replacement of a Crossing by a Footbridge.
- Variants of the Crossing itself (signalled, raised) with a lower capacity cut, and a Road-Tier-dependent cut: separate options, not needed here.

## Further Notes

- With the starting costs a Footbridge over one Road walks as `1 + (1 + 3) + 1` between the two sidewalks, against 3 for a Crossing. The stairs make it dearer than a Crossing on purpose: it pays off only where the Crossing is removed. Balancing may narrow the gap (`crossingExtraCost`, staircase cost).
- Shape settled: U. Both corridors are on the same side of the deck, so in each end row of the 2-wide footprint the corridor is on the same lane at both ends and the staircase on the other, and the deck continues from the staircase lane; a single orientation (4 rotations, no mirror) covers every placement. Z is out of scope.
- To check while implementing: whether a Road tile with a Crossing under a span is allowed (proposal: yes, the Crossing keeps working beneath, it is just another road tile); how scene pedestrians choose between the bridge and a nearby Crossing.

## Issues

To write, in order:

01 Core: Footbridge carrier, placement rules, persistence.
02 Core: pedestrian graph edge and network isolation (Road, BRT, Railway, access).
03 Placement tool, price, unlock, refund, FR/EN.
04 Scene rendering, scene pedestrians, Street view.
05 Guide, glossary, balancing and ADR amendment.
