---
status: accepted
---

# Unemployment lowers Well-being

Amends [ADR 0041](0041-office-buildings-earn-urbs-from-filled-jobs.md) and [ADR 0059](0059-every-citizen-looks-for-a-job-and-picks-the-mode-by-travel-time.md), which kept Unemployed a statistic with no effect.

**The trigger.** With a Jobs Layer and a Jobs section, the player can read who has no Job, but nothing is at stake: a city can leave a third of its Citizens without work and lose nothing, so Offices, Shops and the Commute carry no weight for the Citizens themselves.

**The rule.** A Home's Citizens who find no Job lower its Well-being. The malus grows linearly with the Home's share of Unemployed Citizens, with none up to a tolerance of 5% (some unemployment is normal) and a cap of 20 points at 100%, as the Pollution malus is capped at 20 and the Congestion malus at 25. Both figures are data (`assets/defs/balance/traffic.json`), not code (ADR-0021).

**Where it sits.** It is a new Need factor, **Employment**, at the Safety level, with the Well-being effect only: no Sanction and no block on a Tier upgrade, as Congestion. The Tax follows only through Well-being, which already modulates it.

**What does not change.**
- A Home with no Road, reached only by a BRT corridor or Pedestrian ways, is never counted Unemployed (ADR 0059), so it is never docked.
- No bonus for full employment: only the lack is penalised, as for Congestion and Pollution.
- The malus does not apply during an Adaptation period, so a saved city is not punished the day it loads.
- The same rule at every Difficulty.

**A Diagnosis.** The Jobs section explains the malus with a Cause: too few Jobs for the city's Citizens, or Jobs the Unemployed cannot reach.

## Considered options

- **Keep Unemployed a statistic.** Rejected by the user: the Jobs the city offers should matter to its Citizens.
- **A city-wide malus from the unemployment rate.** Rejected: it would punish a Home that is next to its Jobs for a far district's choices, and Well-being is computed per Home.
- **A Sanction on the Tax.** Rejected: Sanctions are for the Vital and Safety supplies a Difficulty chooses to enforce; Employment follows Congestion and only lowers Well-being.

## Consequences

- A city with fewer Jobs than Citizens loses Well-being, and so Tax, on the Homes that miss a Job. The values may need balancing.
- Well-being now depends on the Commute through the Jobs as well as the Congestion.
