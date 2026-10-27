# Glass emissive shader

Status: ready-for-agent
Spec: ../spec.md

## What to build

Patch the building materials so the pixels of the glass palette colour can glow warm yellow, driven by one uniform, with nothing yet deciding which windows. Find which glass colours the building models use and what else shares them.

## Acceptance criteria

- [ ] Glass pixels glow with the uniform at 1 and look unchanged at 0, on a Home, an office and a public building.
- [ ] Nothing else on the model glows (check solar panels and doors).
- [ ] Repaint tone palettes still work (the glass colour must not move with the tone).
- [ ] No new light source; materials stay shared per model and tint.
