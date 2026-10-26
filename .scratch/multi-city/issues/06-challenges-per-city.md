# Challenges per City

Status: done - implemented
Blocked by: 01
Spec: ../spec.md

## What to build

Accepted Challenges bound to the City that accepted them.

## Acceptance criteria

- [x] Each City has at most one accepted Challenge; several Cities of one account may accept the same Challenge.
- [x] The Challenge stock comes from that City's Storehouse.
- [x] Abandoning closes the Challenge for that City only; that City cannot accept it again.
- [x] Time skip is refused only in a City with an unfinished accepted Challenge.
- [x] Server rows and RPC carry the City id; pgTAP covers acceptance per City.
