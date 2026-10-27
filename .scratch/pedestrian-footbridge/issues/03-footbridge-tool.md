# Placement tool, price, unlock, refund

Status: resolved
Blocked by: 01
Spec: ../spec.md

## What to build

The Bridge flyout offers the pedestrian Carrier with span length choice and a rotating ghost.

## Acceptance criteria

- [x] Third Carrier choice in `BridgeTools.tsx`, wired in `tools.ts` and `commands.ts`.
- [x] Ghost shows the 2-wide footprint, green when valid, red with the refusal reason otherwise; 4 rotations.
- [x] Price table per span length (corridors and staircases included), starting at the Road Bridge price × 0.6; unlock at 120 Citizens.
- [x] FR/EN strings; Storybook story updated; one React component per file.
- [x] Values recorded in `balancing.md`.
