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
