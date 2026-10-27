# Glass emissive shader

Status: resolved
Spec: ../spec.md

## What to build

Patch the building materials so the pixels of the glass palette colour can glow warm yellow, driven by one uniform, with nothing yet deciding which windows. Find which glass colours the building models use and what else shares them.

## Acceptance criteria

- [x] Glass pixels glow with the uniform at 1 and look unchanged at 0 (checked in the browser on an apartment Home; not yet checked by eye on an office and a public building).
- [x] Nothing else on the model glows on the Home checked; the solar panel colour (#26304f) differs from the glass cell (#9fcdea).
- [x] The tone palette PNGs keep the glass cell (checked on `house-1x1-1f-tone-a`); Repaint not checked by eye.
- [x] No new light source. Building materials are cloned once per model and tint, and patched with a shared uniform (`src/scene/windowGlow.ts`).

## Findings

- 273 of the 285 building GLBs contain the glass cell `#9fcdea`; the 11 without are trees and the marina captaincy.
- The palette samplers are NEAREST, so a pixel compares exactly with the glass cell.
- A model draws all its pixels of that colour, so any other part painted with `glass_blue` would glow too.
