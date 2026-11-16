# Interior guided demonstrations

The Factory has three scenarios: `factory-simple`, `factory-intermediate` (Gears and
turn direction) and `factory-advanced` (Flow circuit and Motor overload). The Workshop has
three as well: `workshop-simple` (air circuit, Line and restocker), `workshop-intermediate`
(Cleaner and Shafts) and `workshop-advanced` (diagnosing a misfacing Conveyor). The Packhouse and the
Bakery have three each: `packhouse-simple` (straight Conveyors and an elbow), `packhouse-intermediate`
(splitting Conveyor toward two Exits), `packhouse-advanced` (joining Conveyor, right and wrong side), and
`bakery-simple` (Mixer, Oven, counter, baker and seller), `bakery-intermediate` (straight splitting Conveyor,
two counters and sellers), `bakery-advanced` (joining two Mixers into one Oven). The Mill has
`mill-simple` (olive oil), `mill-intermediate` (flour and the Bagger), and `mill-advanced`
(diagnosing a misfacing oil tank). The Storehouse has `storehouse-simple` (Dock and Rack),
`storehouse-intermediate` (Hoist and split), and `storehouse-advanced` (diagnosing a stopped Hoist).
The Textile mill has `textileMill-simple` (Spinner and Motor), `textileMill-intermediate` (Gear and right-output Spinner),
and `textileMill-advanced` (diagnosing disconnected Drive). The Recycling plant has
`recyclingPlant-simple` (Shredder), `recyclingPlant-intermediate` (left-handed Crusher and split),
and `recyclingPlant-advanced` (diagnosing a stopped Sorter). The Dairy has `dairy-simple`
(Milk vat and Counter), `dairy-intermediate` (Pasteuriser, split and cream maker), and `dairy-advanced`
(diagnosing missing Flow). The Knitwear factory has `knitwearFactory-simple` (Knitter and Finisher),
`knitwearFactory-intermediate` (left-handed Machines and split), and `knitwearFactory-advanced` (missing Finisher Drive).
Open an interior's
Management view, choose **Demonstrations**, then **Simple**. It is also available
from the Factory entry on the codex's Production interiors page, even without
owning or unlocking a Factory. Use `?e2e` for browser verification.

## Replay and verification

```sh
npm run demonstrations:verify
npm run demonstrations:verify -- factory-advanced
```

The command loads the current game rules and runs each semantic command and
step expectation. A rejected action or expectation exits unsuccessfully with
the scenario id, step number and step id. `npm run build` includes this check in
its prebuild sequence. The native game-engine player is the preview: it uses the
same script, not a separately recorded video.

## Write a scenario

1. Add a definition under `src/core/demonstrations/`, following
   `factorySimple.ts`. Give it a stable id, building type, learning level,
   building id, bilingual title and objective.
2. Supply a deterministic initial GameState with a fixed seed and clock and
   every prerequisite the demonstration needs. Never read or copy the player's
   live City. Supply any Tier, Staff, resources and utility connections required
   by the scenario's actual mechanics.
3. Divide the lesson into steps with stable ids. Each step has bilingual title,
   objective, shown action, explanation and expected result. Keep one main action
   per step. Use semantic game commands for placement, rotation, hiring, etc.;
   do not record screen coordinates or DOM selectors.
4. Add highlighted cells and optionally a camera offset `{ x, y, zoom }`.
   The player can inspect freely and recenter afterward.
5. Add a `check(state)` that throws if the taught outcome is wrong. Use the real
   game's Link, placement, bonus or performance functions. Check expected
   failures explicitly when teaching a diagnosis; never ignore rejected commands.
6. Register the definition in `DEMONSTRATIONS` in `catalog.ts`.
7. Run verification, inspect every step in FR/EN and on desktop/mobile, then
   check previous/next, direct access, pause, restart, camera and close. Ensure
   the City retains its resources and game-clock time and the launching view is
   restored.

`compileDemonstration` executes each step's entry commands and snapshots the
complete isolated state. The viewer clones the selected checkpoint, so elapsed
viewing time or later steps cannot pollute a restored step. Play advances the
isolated simulation and the scene's animations; Pause freezes both. Manual
navigation pauses playback. Autoplay counts visible viewing time and allows
Next immediately.

## Current delivery boundary

The Factory, the Workshop, the Packhouse and the Bakery are covered at all three levels. Remaining interior types follow. The current canvas
and indicators serve the Production pilot; Venue, Service and Home rendering
and indicators must be adapted and verified before registering those scenarios.
Exported video, voice recordings, exercises and saved viewing progress are out
of the first version.

A live online Challenge blocks launch because its server deadline cannot pause.
Existing layout examples and Venue tutorials remain available separately.
