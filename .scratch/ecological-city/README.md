# Ecological city implementation tickets

Source: [Approved specification](spec.md)

All 20 tickets were triaged `ready-for-agent` and implemented. `Status` retains the canonical triage label; `Completion: completed` records closure separately. Dependencies are satisfied. See [balancing](balancing.md) and [validation evidence](validation.md).

| Ticket | Stage | Status | Completion | Dependencies |
| --- | --- | --- | --- | --- |
| [01 — Define ecological rules and initial balancing tables](issues/01-design-and-balancing-contract.md) | Preparation | ready-for-agent | completed | None |
| [02 — Provision ecological building and transport assets](issues/02-provision-ecological-models.md) | Preparation | ready-for-agent | completed | None |
| [03 — Open MaximalStats from every HUD layout](issues/03-city-management-dashboard.md) | Stage 1 | ready-for-agent | completed | 01 |
| [04 — Add paid Home insulation upgrades](issues/04-home-insulation.md) | Stage 1 | ready-for-agent | completed | 01 |
| [05 — Build trees and small neighborhood parks](issues/05-trees-and-neighborhood-parks.md) | Stage 1 | ready-for-agent | completed | 01, 02 |
| [06 — Explain ecological effects and city efficiency](issues/06-ecological-indicators-and-explanations.md) | Stage 1 | ready-for-agent | completed | 03, 04, 05 |
| [07 — Teach sobriety and local green-space benefits](issues/07-stage-one-learning-objectives.md) | Stage 1 | ready-for-agent | completed | 04, 05, 06 |
| [08 — Validate the management and green-space stage](issues/08-stage-one-release-validation.md) | Stage 1 | ready-for-agent | completed | 07 |
| [09 — Add solar Homes, solar installations and explicit wind generation](issues/09-solar-and-wind-generation.md) | Stage 2 | ready-for-agent | completed | 01, 02, 08 |
| [10 — Simulate economic energy Demand and shortage allocation](issues/10-energy-accounting-and-shortages.md) | Stage 2 | ready-for-agent | completed | 09 |
| [11 — Share solar surplus with nearby Homes](issues/11-local-surplus-sharing.md) | Stage 2 | ready-for-agent | completed | 10 |
| [12 — Store renewable energy in neighborhood batteries](issues/12-neighborhood-batteries.md) | Stage 2 | ready-for-agent | completed | 11 |
| [13 — Add dispatchable backup generation with costs and emissions](issues/13-polluting-backup-generation.md) | Stage 2 | ready-for-agent | completed | 12 |
| [14 — Adapt existing cities and preserve deterministic energy catch-up](issues/14-energy-adaptation-and-catch-up.md) | Stage 2 | ready-for-agent | completed | 13 |
| [15 — Explain and validate the renewable energy stage](issues/15-stage-two-dashboard-learning-and-validation.md) | Stage 2 | ready-for-agent | completed | 14, 06 |
| [16 — Place visible bus-stop signs beside roads](issues/16-roadside-bus-stops.md) | Stage 3 | ready-for-agent | completed | 01, 02, 15 |
| [17 — Create and manage bus lines between selected stops](issues/17-player-defined-bus-lines.md) | Stage 3 | ready-for-agent | completed | 16 |
| [18 — Calculate bus usage, operating costs and traffic reduction](issues/18-bus-usage-and-traffic-effects.md) | Stage 3 | ready-for-agent | completed | 17 |
| [19 — Explain public transport coverage and efficiency](issues/19-transport-dashboard-and-learning.md) | Stage 3 | ready-for-agent | completed | 18 |
| [20 — Validate transport and the complete ecological city](issues/20-stage-three-release-validation.md) | Stage 3 | ready-for-agent | completed | 19 |

## Delivery gates

- Stage 1 is validated by ticket 08.
- Stage 2 starts after stage 1 and is validated by ticket 15.
- Stage 3 starts after stage 2 and is validated by ticket 20.
- Ticket 01 defines provisional balancing parameters and unresolved mechanical details before dependent implementation begins. Ticket 02 can run independently.

