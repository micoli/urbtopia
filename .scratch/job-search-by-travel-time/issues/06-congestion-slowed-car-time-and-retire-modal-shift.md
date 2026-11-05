# 06: Congestion slows the car, Modal shift is retired

Status: ready-for-agent
Blocked by: 05

**What to build:** Car Travel time uses the speed each Road section reaches under Congestion, in two passes (free-flow, then with the first pass's speeds), as bus speeds already do. The Modal shift step is removed.

- [ ] Two passes only, bounded and deterministic; catch-up replays give the same result as stepping.
- [ ] `modalShift.ts`, `SHIFT`, its `shift` field and the "Riders won" line of the Traffic section are removed, with their tests.
- [ ] A saturated road pushes Citizens towards a line with spare capacity (test).
- [ ] The balancing figures that read `SHIFT` are moved to `.scratch/traffic-congestion/balancing.md` as superseded.
- [ ] Glossary: `CONTEXT.md` no longer names the Modal shift as a live term.

## Comments
