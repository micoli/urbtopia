---
status: accepted
---

# Transit reach extends Service coverage over fast lines

A Public facility's Service coverage can reach Homes beyond its square when fast public transport links the two. Three choices are hard to reverse and look odd without context. Extends ADR 0005 (coverage-based mobility), respects ADR 0007 (capacity-aware transfers) and ADR 0039 (Waste keeps its road link).

**Only lines that are never slowed.** BRT stations, Railway stations and Transit hubs extend reach; ordinary Bus stops do not. The Effective speed of a Bus line changes with Congestion, so a bus-based reach would grow and shrink with traffic and the player could not read it on the map. Including buses with their nominal speed was rejected: it would promise a reach the buses do not deliver.

**An itinerary bounded in time, not a distance.** A Home is covered when a stop near the facility and a stop near the Home are joined by a Transit itinerary (at most two Transfers) whose travel time stays under one global threshold. The time counts vehicle time, waiting and Transfers, not the walk to the stop, which the stop coverage distance already bounds. Same-line only was rejected as too restrictive for a network the player builds in pieces; a straight-line distance between stops was rejected because it ignores the lines that actually exist, which is the point of an isochrone map.

**Same coverage, derived state.** A Home covered through Transit reach counts exactly like a directly covered one (Well-being, Tier upgrades, Needs, Sanctions, Objectives) and uses the same Citizen capacity, Homes in direct reach served first, then the others from the shortest travel time. It takes no place on the lines: coverage is a state, not a flow of Riders. Nothing is saved; it is recomputed when buildings, lines or roads change. Waste is excluded.

The threshold lives in the Balance data (ADR 0023). A threshold per Service category was left out and can be added without changing the rule.
