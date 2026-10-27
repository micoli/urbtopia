# Placement tool, price, unlock, refund

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

The Bridge flyout offers the pedestrian Carrier with span length choice and a rotating ghost.

## Acceptance criteria

- [ ] Third Carrier choice in `BridgeTools.tsx`, wired in `tools.ts` and `commands.ts`.
- [ ] Ghost shows the 2-wide footprint, green when valid, red with the refusal reason otherwise; 4 rotations.
- [ ] Price table per span length (corridors and staircases included), starting at the Road Bridge price × 0.6; unlock at 120 Citizens.
- [ ] FR/EN strings; Storybook story updated; one React component per file.
- [ ] Values recorded in `balancing.md`.
