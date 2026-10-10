# Shop kind with Tiers, General shop and sellable Goods

Status: ready-for-agent
Spec: [shop-categories](../spec.md)
Blocked by: 01

Replace the `standard` Shop by a `kind: "shop"` building in the zod schema: `goodCategory`, `slotPriceFactor` (default 1) and `tiers[]` (model, `maxSlots`, Goods sold, sales cadence, Jobs, `upgradeCost`), 4 Tiers, values inherited per ADR 0023. Rewrite `shop.json` as the General shop (cost, upgrade costs and extra Slot prices x2). Game: Shops upgrade like Workshops, sell only the Goods listed for their Tier (General: union of the specialised Shops at the same Tier), Slot price uses `slotPriceFactor`, Jobs per Tier. Reference validator: listed Goods exist and match the Shop's category (General exempt). Amends ADR 0023 per ADR 0024.

Acceptance:
- A Shop of Tier N sells only its category's Goods listed for Tier N; the General shop sells the union.
- Upgrade, extra Slot and Jobs follow the Tier; costs of the General shop are doubled.
- Unit tests on sales restriction, upgrade and Slot price.
