# Shops are per Good category with Tiers; the General shop stays at a premium

Accepted. Amends [ADR 0023](0023-tier-values-and-balancing-as-data-formulas-in-code.md) for Shops.

Shops used to be one untiered building selling any Good. Each Good now has a category, and one Shop exists per category with four Tiers, selling only Goods of its category that its Tier lists. The original Shop is kept as the General shop, still buildable, selling every category but costing twice as much to build, upgrade and extend with Slots.

## Why

- Specialised Shops give the player a reason to build several Shops and to care about which Goods the city produces.
- Existing cities hold Shops that sell everything; retiring them would break saves, and a free joker would make specialised Shops pointless, hence the premium.

## Considered options

- **One Shop with a runtime category choice**: rejected, ADR 0021 defines a Game object per file and per kind of building.
- **Retire the General shop**: rejected, the premium keeps it valid without breaking cities.
- **Category as menu section only**: too weak, it would not restrict sales.

## Consequences

- Hard to reverse: the Good category and the Shop file shape reach saves and every definition file.
- Exception to ADR 0023: the Goods a Shop sells are an explicit list per Tier in the Shop file, not a `minTier` on the Good, because `minTier` on a Good already means the Factory Tier that produces it. The editor's Tiers view reads these lists.
- The General shop keeps the id `shop`, so saved Shops load as General shops at their Tier 1 with no save migration; a stack of a Good the Tier no longer lists keeps selling.
