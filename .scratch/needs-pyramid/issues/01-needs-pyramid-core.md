# Needs pyramid core computation

Status: resolved

Pure function in `src/core/environment/` returning Need levels, factors (0-100, "not modelled" flag), per-level Citizen-weighted score, fragile flag and bottleneck, from existing `homeBenefits` / `cityBenefits` data. Export from `src/core/index.ts`. Unit tests per the spec's acceptance list.

Spec: `../spec.md`
