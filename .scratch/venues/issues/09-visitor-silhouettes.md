# 09: Visitor silhouettes in the interior

**What to build:** The interior shows silhouettes of Visitors using the Fixtures and queuing at the counter, as a pure projection of the aggregate model.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] The number of silhouettes follows the Visitors and the occupancy of the Fixtures; they use the Mini Arcade employee and gamer characters.
- [ ] Positions are chosen from the grid and the layout, with no pathfinding; two silhouettes never overlap.
- [ ] Silhouettes are never saved and are rebuilt on opening the Management view.
- [ ] A queue at the counter grows when the service rate is limited, shrinks otherwise.
- [ ] Rendering reuses instancing; opening the view stays smooth on a phone.
