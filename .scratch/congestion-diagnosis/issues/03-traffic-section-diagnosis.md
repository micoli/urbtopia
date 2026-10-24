# Diagnosis in the Traffic section

Status: resolved
Spec: ../spec.md
Blocked by: 01, 02

## What to build

Show the Congestion Diagnosis in `TrafficSection`, under the existing figures.

## Acceptance criteria

- [ ] `TrafficSection` renders `DiagnosisPanel` with `diagnoseCongestion(...)`, memoised on the same inputs as the section.
- [ ] Texts for every Cause key in English and French in `src/i18n/catalog.ts`, in plain words ("Most of your busy roads are still single-lane", not code names), with the figures in the sentence.
- [ ] "Show on map" focuses the tile of the Cause.
- [ ] Nothing appears when Congestion is low; the existing worst-bottleneck button stays.
- [ ] Component test in `CityManagement.test.tsx` style, and the `TrafficSection` story gets a congested variant.
