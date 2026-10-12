# Sanction core computation

Status: resolved
Blocked by: 01, 02

Pure core function giving each Home's Sanction: its weakest sanctionable factor and a Tax multiplier in [0.5, 1], continuous in satisfaction. Needs per-Home factor satisfactions (today `needs.ts` aggregates them over the city). Replace the Tax multiplier at `advance.ts` so that:
- the Well-being factor is `max(1, 1 + wellbeing / divisor)`;
- under Cozy the existing electricity scaling is kept untouched;
- from Easy, electricity and water go through the Sanction instead of the old ratio;
- Hard's `climate` sanctions only Homes with no Green space in reach.

Acceptance: unit tests per Difficulty, including a Home sanctioned by two factors (worst wins), the 0.5 floor, a Cozy city byte-identical to before, and a negative Well-being that no longer lowers the Tax. Core isolation test (`coreIsolation.test.ts`) still passes.

Spec: `../spec.md`

## Comments

Resolved. Decision taken while implementing: the acceptance list contradicted itself (Cozy "byte-identical" vs "negative Well-being no longer lowers the Tax"). Cozy keeps the whole previous formula, power received times `1 + wellbeing / divisor`, so existing cities do not change. From Easy, the Tax is `max(1, 1 + wellbeing / divisor)` times the Sanction multiplier, so a negative Well-being no longer lowers it.

Code: `src/core/environment/sanction.ts` (`homeSanction`, `homeTaxMultiplier`), per-Home Need satisfactions extracted in `needs.ts` (`needsContext`, `homeNeedSatisfactions`), used by `advance.ts`. "Green space in reach" for Climate means a cooling above 0 in `greenBenefits`.
