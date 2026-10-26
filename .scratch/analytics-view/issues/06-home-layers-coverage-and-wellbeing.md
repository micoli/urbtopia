# Home Layers: Coverage And Well-being

Status: resolved
Spec: ../spec.md
Blocked by: 02

## What to build

Per-Home Data layers: Service coverage with a third menu level to pick the Service category (reusing `coveredHomeIds`, transit reach and the Waste road link), and Well-being as a gradient tint of each Home from the existing Well-being figure.

## Acceptance criteria

- [ ] Every Service category in the menu; Waste uses its road-linked coverage.
- [ ] Covered, covered via transit and uncovered are distinguishable and in the legend.
- [ ] Well-being tint uses the same value as the Home's displayed Well-being.
- [ ] Reuses or replaces `ServiceCoverageLayer` without breaking its current use from the facility panels.
