# Finish summary

Status: resolved
Blocked by: 07

- At Finish, a summary lists the Buildings with no Road, BRT corridor or Pedestrian way in front of them, and the Transit lines to draw again if the City had any, without blocking.
- Done when: Playwright test of the summary; `tsc`, lint and tests pass.

## Answer

Done. `replanSummary` (`src/core/replan/summary.ts`) lists the Buildings with no access and counts the lines of the starting layout; the panel computes it before Finish and `FinishSummaryDialog` shows it once. Power is left out: it is a pool for the whole City, so no Building lacks it because of its place. Spec, ADR 0067 and CONTEXT.md say so.
