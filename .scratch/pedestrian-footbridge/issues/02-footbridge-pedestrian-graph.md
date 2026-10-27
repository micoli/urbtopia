# Core: pedestrian graph edge and network isolation

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

A Footbridge joins the Pedestrian path network without touching any other network, and loads no Road tile.

## Acceptance criteria

- [x] `pedestrianGraph.ts`: one `:P` node per tile of the walk (corridor, stair, deck tiles, stair, corridor), linked at cost 1 each so the walk costs `span + 3`, with `crossing: null`; each corridor links only to its neighbours along the crossing axis.
- [x] A Home and a Shop on either side of a Road reach each other over a Footbridge when no Crossing exists; the Road tile under the deck has no entry in the Crossing stats and keeps full capacity.
- [x] With a Crossing and a Footbridge, the cheaper route wins deterministically.
- [x] A Footbridge over a Railway joins both sides; cyclists use it.
- [x] No sideways access from a road running beside the footprint; no building access from staircase or deck.
- [x] Absent from Road, BRT and Railway graphs, Congestion, Commute (`roadGraph.ts`, `transitNetwork.ts`, `occupancy.ts`).
- [x] The graph cache invalidates when `bridges` changes.

Prior art: `pedestrianGraph` tests, `congestion.test.ts`, `pedestrianFields.test.ts`.
