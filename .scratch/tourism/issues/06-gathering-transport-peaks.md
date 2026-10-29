# Gathering transport peaks and Well-being malus

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 03, 05

## What to build

The crowd arrives in the game hour before and leaves in the hour after. It loads roads, stops and Crossings in those windows only. Poor service gives Congestion and a temporary, moderate Well-being malus nearby; never blocking, never losing Tourists.

## Acceptance criteria

- [ ] Windows tested at the boundaries.
- [ ] Malus fades after the Gathering; it never lowers Tax below the existing floor.
- [ ] Congestion diagnosis names the Gathering as a Cause when relevant.
