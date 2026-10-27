# Scene: models, rendering, scene pedestrians, Street view

Status: resolved
Blocked by: 01, 02
Spec: ../spec.md

## What to build

Footbridges are drawn and walked in the 3D scene.

## Acceptance criteria

- [ ] Blender models (corridor, 90° staircase, deck with railings) in `assets/managed-models/`, built one at a time and shown in the live Blender; labels in English.
- [ ] `renderItems.ts` renders the U footprint for any span and rotation; height is rendering only, the core never reads it (ADR 0011).
- [ ] Scene pedestrians follow the graph path over the deck.
- [ ] Street view (ADR 0046) walks up the stairs and across the deck.
- [ ] Checked by eye in the dev server (`?bypass-tutorial`).
