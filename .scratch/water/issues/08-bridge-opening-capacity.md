# Bridge opening: capacity in the core

Status: resolved
Blocked by: 06
Spec: ../spec.md

## What to build

A Bridge loses capacity in proportion to the Boats that can reach it, so a busy harbour slows the Road over it.

## Acceptance criteria

- [x] `closedFraction` of a Bridge is 0 without Boats, grows with the Boats on the same body of water, and is capped at `maxClosed`.
- [x] The capacity of every Bridge tile is multiplied by `1 − closed fraction`; the Roads on the banks are untouched.
- [x] The congestion layout cache sees new Boats (signature updated).
- [x] ADR 0019, glossary entry and balancing values written.
