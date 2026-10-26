# Showcase and Hall of fame per City

Status: ready-for-agent
Blocked by: 02
Spec: ../spec.md

## What to build

Showcase, opt-out, Visit and Hall of fame moved from the Player account to the City.

## Acceptance criteria

- [ ] Each City has its own Showcase, replaced when that City is saved online.
- [ ] Opt-out is set City by City; an opted-out City has no Showcase and no Hall of fame entry.
- [ ] Hall of fame ranks Cities: one account may have several entries; an entry shows Avatar, Handle, City name, Citizens. ADR 0029 growth caps apply per City.
- [ ] Visit lets the visitor pick among the account's Cities that have a Showcase.
- [ ] Migration and pgTAP for the per-City Showcase; existing Showcases attached to the first City.
