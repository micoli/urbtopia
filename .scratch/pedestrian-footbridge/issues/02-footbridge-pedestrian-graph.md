# Core: pedestrian graph edge and network isolation

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

A Footbridge joins the Pedestrian path network without touching any other network, and loads no Road tile.

## Acceptance criteria

- [ ] `pedestrianGraph.ts`: the two corridor tiles use the `:P` node and are linked by one edge of cost `span + 3` with `crossing: null`; staircase and deck tiles carry no node; each corridor links only to its outer neighbour along the crossing axis.
- [ ] A Home and a Shop on either side of a Road reach each other over a Footbridge when no Crossing exists; the Road tile under the deck has no entry in the Crossing stats and keeps full capacity.
- [ ] With a Crossing and a Footbridge, the cheaper route wins deterministically.
- [ ] A Footbridge over a Railway joins both sides; cyclists use it.
- [ ] No sideways access from a road running beside the footprint; no building access from staircase or deck.
- [ ] Absent from Road, BRT and Railway graphs, Congestion, Commute (`roadGraph.ts`, `transitNetwork.ts`, `occupancy.ts`).
- [ ] The graph cache invalidates when `bridges` changes.

Prior art: `pedestrianGraph` tests, `congestion.test.ts`, `pedestrianFields.test.ts`.
