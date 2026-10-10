# Check saved Shops load as General shop Tier 1

Status: resolved
Spec: [shop-categories](../spec.md)
Blocked by: 02

Add a step to the versioned save envelope (ADR 0003) that turns existing Shops into the General shop at Tier 1, keeping their stacks and Slots. Include the evolved-city fixture. Cloud mirror unaffected.

Acceptance:
- A save made before the change loads, with its Shops as General shops of Tier 1 and their stacks intact.
- Migration test with a legacy save.

## Comments

No migration step was needed: the General shop keeps the id `shop` and `tier` already defaults to 1. Covered by `src/persistence/shops.test.ts` (legacy Shop with a stack of a Good its Tier no longer lists, specialised Shop round trip, frozen v12 save holding a Shop). The version stays at 12.
