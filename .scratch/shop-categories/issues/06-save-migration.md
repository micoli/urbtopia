# Migrate saved Shops to General shop Tier 1

Status: ready-for-agent
Spec: [shop-categories](../spec.md)
Blocked by: 02

Add a step to the versioned save envelope (ADR 0003) that turns existing Shops into the General shop at Tier 1, keeping their stacks and Slots. Include the evolved-city fixture. Cloud mirror unaffected.

Acceptance:
- A save made before the change loads, with its Shops as General shops of Tier 1 and their stacks intact.
- Migration test with a legacy save.
