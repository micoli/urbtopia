# Bus load and effective speed

Status: ready-for-agent
Blocked by: none

## What to build

Each active Bus line loads the roads it uses and gets an effective speed from the Congestion of its route (core, pure).

## Acceptance criteria

- [ ] Constant bus load (start 20) on every tile of the route of each active Bus line; none for inactive lines, BRT or rail
- [ ] Bus-only tiles create sections and can saturate
- [ ] Effective speed = nominal × length ÷ Σ(1 + excess), floor 50%
- [ ] Speeds and ratios exposed in the congestion statistics per line
- [ ] Layout signature covers the route tiles; deterministic across calls and catch-up
- [ ] Unit tests: load, bus-only saturation, speed, floor, inactive lines, BRT and rail unaffected

## Comments
