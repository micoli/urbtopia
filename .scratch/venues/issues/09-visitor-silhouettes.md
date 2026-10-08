# 09: Visitor silhouettes in the interior

**What to build:** The interior shows silhouettes of Visitors using the Fixtures and queuing at the counter, as a pure projection of the aggregate model.

**Blocked by:** 04

**Status:** done

- [x] The number of silhouettes follows the Visitors and the occupancy of the Fixtures; they use the Mini Arcade employee and gamer characters.
- [x] Positions are chosen from the grid and the layout, with no pathfinding; two silhouettes never overlap.
- [x] Silhouettes are never saved and are rebuilt on opening the Management view.
- [x] A queue at the counter grows when the service rate is limited, shrinks otherwise.
- [x] Rendering reuses instancing; opening the view stays smooth on a phone.

## Comments

- The plan is a pure function (`src/scene/venueCrowd.ts`): one gamer in front of each busy game (more when the Venue is saturated, at least one as soon as someone plays), employees by the counter (up to three), and a queue of up to six near the counter that grows with `accepted Visitors / capacity` above 1. Positions come from free grid cells in a fixed order, so two figures never overlap and none stands on a Fixture or the entrance. At most 24 figures.
- The characters of Mini Arcade are skinned, so they are cloned with `SkeletonUtils`, not instanced. At most 24 clones is cheap, but I did not measure it on a phone. The figures are rebuilt only when the plan changes.
- Employees are Staff, not Visitors: they show up when an employee is hired and the Venue is open.
- Follow-up: the people now move. `src/scene/venueAgents.ts` (pure, tested) gives each agent a position on the grid, a path around the Fixtures (a breadth-first search, for the picture only), and a small life: a customer walks in through the entrance, plays 7 to 16 seconds at a game, then leaves through the entrance and is replaced; a customer in the queue gets more impatient and walks out when it has had enough; an employee stands at the post, goes and checks a Fixture from time to time, then comes back. `VenueCrowdLayer` plays the `idle`, `walk` and `interact` clips of the characters.
- Each customer carries a thin satisfaction bar over the head, red to green. The mood of the Venue (`satisfaction` of the performance: service against Visitors, price, layout, stock or cleanliness by type) is the level a customer recovers toward while playing; waiting lowers it.
- Nothing of this is saved and none of it feeds the economy; the paths of the picture are not the pathfinding that ADR 0020 rules out for the model.
- Second follow-up: a player stands 0.38 of a cell toward its Fixture (`standPoint`), facing the tile it uses, so it is right in front of it; an employee 0.25. Gestures are drawn at random (`pickClip`): a player alternates the left and right arm, holds the controls with both hands, sometimes cheers or shakes the head by mood; an impatient customer in the queue complains; an employee at the post sometimes works with their hands. Each person keeps a gesture 1 to 4 seconds, starts at a random point of the cycle and plays at its own speed (0.88 to 1.14), so nobody moves in step.
