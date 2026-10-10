# Assets editor: Shops and Good category

Status: resolved
Spec: [shop-categories](../spec.md)
Blocked by: 02

Make the editor handle the new kind: field labels and hover docs (`goodCategory`, `slotPriceFactor`, per-Tier Goods list), default values when creating a Shop, Tiers view reading each Shop Tier's Goods list, live reference validation (existing Goods, category match), ICU placeholders for the `shop` kind descriptions, tests (`fields.test.ts`, `edits.test.ts`).

Acceptance:
- A Shop and its Tiers are editable end to end in the editor.
- An invalid Good in a Tier list is reported live.
