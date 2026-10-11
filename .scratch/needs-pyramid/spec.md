# Needs pyramid (Well-being on the city management page)

Status: resolved

## Goal
Materialise and evaluate Well-being on the city management page (`src/ui/stats/CityManagement.tsx`) as a **Needs pyramid** of five **Need levels**, with a table that explains the diagram. Vocabulary: **Need level**, **Needs pyramid** in `CONTEXT.md`.

## Out of scope
- No gameplay change: Well-being, Tax, Home Tier upgrades and Demand behave as before. A Need level is read-only.
- No hard gating between levels, no per-Home pyramid in `HomePanel` (later iteration).
- No ADR now; one will be needed when the Well-being formula is rebuilt on the pyramid.

## Need levels and factors (base to top)

| Need level | Factors | Source today |
|---|---|---|
| Vital | electricity, water; food shown as "not modelled" | `energyStats`, water Capacity/Demand |
| Safety | Safety, Health, coal pollution, Congestion, climate (temperature) | Service coverage; `pollutionPenalty`; `congestionPenalty` |
| Belonging | Culture, Leisure buildings, walking | Service coverage; `leisureRetention`; `walkAccess` |
| Esteem | Education, Administration; Shops shown as "not modelled" (no Shop coverage rule exists) | Service coverage |
| Fulfilment | Green spaces, biodiversity | `greenBenefits` per Home |

No new mechanic is invented: a factor with no existing data is displayed as "not modelled" and left out of the average.

## Computation
- Every factor is a satisfaction from 0 to 100, derived from values `homeBenefits` / `cityBenefits` already compute (no recomputation of the rules):
  - service factors: share of Citizens with Service coverage;
  - pollution: 100 minus `pollutionPenalty` over `ECOLOGY.coalWellbeingCap`;
  - climate: temperature from the optimum (26 °C, 100) to 34 °C (0), steeper than the 40 °C game maximum, no gameplay effect yet;
  - Congestion: 100 minus `congestionPenalty` over `CONGESTION.penaltyCap`;
  - green spaces: existing green score; walking: `walkAccess`;
  - electricity: Demand met over Demand; water: Capacity over Demand, capped at 100.
- A Need level score is the Citizen-weighted mean of its factors.
- The weakest factor of the city is the bottleneck.
- A level is **fragile** when a level below it is under a threshold (constant in code, no hard gating).
- The module lives in `src/core/environment/` as a pure function next to `wellbeing.ts`, returning levels, factors and bottleneck. UI only formats.

## UI
- New section "Needs" in the city management page, reachable from the existing `SectionNavigation`.
- Pyramid of 5 stacked stages, each with a satisfaction bar, its score and a fragile marker.
- The Well-being tile of `CityOverview` scrolls to this section.
- Bottleneck badge links to the detailed section of its factor (energy, traffic, ...), like `BottleneckButton`.
- Table explaining the diagram, one row per factor grouped by level, plus a total row per level:

| Level | Need | Satisfied by | Current measure | Satisfaction | Effect today |
|---|---|---|---|---|---|

  "Effect today" states what the factor changes now (Well-being, Tax, Tier upgrade block, Demand). A row click scrolls to the detailed section.
- Texts in `src/i18n/fr.ts` and `src/i18n/messages.ts`. One React component per file.

## Acceptance
- Core function unit tested: empty city, fully served city, one missing Service category, coal pollution, Congestion, "not modelled" factors left out.
- `CityManagement.test.tsx` covers the section, the table rows and the bottleneck link.
- Existing `WellbeingSection` penalty lines stay or move into the table; no information is lost.
- The city Well-being value in the overview is unchanged.
