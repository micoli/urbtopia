# 01: Waste production, processing and coverage end to end

**What to build:** From 800 Citizens the player can build Mounds and see Homes become covered or not. Production, the allocation clean to dirty, the usage cost, the road link and the Carrying distance work headless in the pure core, with the injected clock and Catch-up. One placeholder Mound is enough.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Waste is a Service category (sixth). A Home's Waste is its Citizens × the Balance rate, derived and never saved.
- [ ] Facilities are used Recycling plant, Incinerator, Mound; within a facility nearest Homes first; the Home crossing the capacity is still served.
- [ ] Usage cost per unit processed per facility, deducted daily; a facility that cannot pay stops and its Homes are uncovered, no debt.
- [ ] A Home is covered only if reached, within capacity and linked to the facility through the Road network. Pedestrian-only Homes are linked through a Road touched by their Pedestrian path network within the Carrying distance and cost twice the tariff.
- [ ] The cause of an uncovered Home is computed: out of reach, capacity full, no road link, beyond the Carrying distance.
- [ ] Mound access: itself, an adjacent Mound, or a group touching a Pedestrian path network that reaches a Road.
- [ ] Adaptation period when a saved city above 1000 Citizens first sees Waste; no Sanction under Cozy.
- [ ] Balance values (rate, capacities, relative tariffs, Carrying distance, surcharge) live in data, not in code (ADR 0023).
- [ ] Tested headless: production, allocation order, unpaid facility, pedestrian link and Carrying distance, surcharge, catch-up.
