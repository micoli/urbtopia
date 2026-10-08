# Drawbridge animation

Status: resolved
Blocked by: 07, 08
Spec: ../spec.md

## What to build

A Bridge visibly opens in two leaves when a Boat wants to pass beneath it, and the traffic stops like at a red light.

## Acceptance criteria

- [x] A 1-tile Bridge lifts one leaf from one side; 2 tiles give one leaf per tile; 3 tiles give 2 + 1; 5 tiles give 3 + 2. Each leaf is hinged on its bank.
- [x] A Boat that reaches a closed Bridge waits, the Bridge opens, the Boat passes beneath, then the Bridge closes.
- [x] Vehicles stop before the Bridge while it is not closed; Vehicles already on the deck clear it before it lifts.
- [x] The animation reads the core and is not saved; Boats are no longer hidden under a Bridge.
- [x] Pure logic covered by tests in `src/scene`.
