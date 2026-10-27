# Scene: models, rendering, scene pedestrians, Street view

Status: resolved
Blocked by: 01, 02
Spec: ../spec.md

## What to build

Footbridges are drawn and walked in the 3D scene.

## Acceptance criteria

- [x] Blender models (corridor, 90° staircase, deck with railings) in `assets/managed-models/`, built one at a time and shown in the live Blender; labels in English.
- [x] `renderItems.ts` renders the U footprint for any span and rotation; height is rendering only, the core never reads it (ADR 0011).
- [x] Scene pedestrians follow the graph path over the deck.
- [x] Street view (ADR 0046) walks up the stairs and across the deck.
- [x] Checked by eye in the dev server (`?bypass-tutorial`).
