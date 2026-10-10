# Comparison view

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 15

Per kind: every object × one chosen field per Tier, as a table and a curve, editable inline, same save and validation as the forms.

## Comments

Delivered (2026-10-10):

- "Compare" in the Buildings list opens a view per kind with Tiers (home, production, storage, facility, casino, venue, marina…): pick a value (every number a Tier sets, plus the upgrade cost) and read every object of the kind across its Tiers as a table and as a curve.
- Cells are editable inline: a value is set on its own Tier (inherited values are greyed), through the same document, undo, validation and save as the forms.
- Limited to the Buildings collection, the only one with Tiers.
