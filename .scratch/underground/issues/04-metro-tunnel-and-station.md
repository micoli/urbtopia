# Metro: Tunnel and Metro station

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01, 02

## What to build

The player builds Tunnels on Level -2 and Metro stations from the Surface.

## Acceptance criteria

- [ ] Tunnels placeable under anything, Water included, independent of Road, BRT and Railway (ADR 0006).
- [ ] A Metro station is placed on a free Surface tile touching a Sidewalk or a Pedestrian way; inactive while no Tunnel lies under it.
- [ ] A Metro station is an access to Level -1 when a walkway touches it.
- [ ] Removing a station leaves the Tunnel; unlock after the Railway; prices from `balancing.md`.
