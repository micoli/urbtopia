# 01: Venue Fill rate and Jobs display

Status: needs-triage
Blocked by: none

**What to build:** Make a Venue's Jobs readable and meaningful. Its Jobs stay its hired Staff; the Commute fills them in aggregate.

- [ ] A core function gives a Venue's Fill rate (filled Staff over hired Staff, 1 when no Staff is hired).
- [ ] `frontRate`, `securityRate` and `managerYield` take the Fill rate into account, in proportion; a test shows a Venue with half its Staff filled performs less than a full one.
- [ ] The Venue panel shows hired, filled and Tier posts side by side.
- [ ] Wages are still paid on hired Staff.
- [ ] Saved cities load unchanged (no migration needed, or one is written and tested).
- [ ] `CONTEXT.md` terms respected: Unfilled Job, Fill rate, Staff.
- [ ] Consider an ADR (hard to reverse, surprising, real trade-off) for Staff counting by Fill rate.
