# Performance and low-power cutoff

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 04

## What to build

Measure the frame time on the dense reference city before and after (ADR 0034), and switch the feature off on `low-power` devices. Write ADR 0050.

## Acceptance criteria

- [ ] Median frame time within +5% on the reference phone or the render budget bench.
- [ ] Off automatically on devices detected as `low-power`.
- [ ] ADR 0050 written, extending ADR 0034.
