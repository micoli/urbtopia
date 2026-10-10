# Shop categories, Tiers and sellable Goods

Status: needs-triage

Today the Shop is a `standard` building (`assets/defs/buildings/shop.json`): no Tier, no category, sells any Good. This spec gives Shops Tiers and a Good category, and restricts what each Shop sells. Vocabulary: see `CONTEXT.md` (Shop, Good category, General shop).

## Decisions

- **Good category.** Every Good gets exactly one `category`, a closed enum bound to code: Construction (bricks, cement, planks, tiles, glass, steel), Food (cannedFish), Equipment (tools, circuits), Luxury (jewelry, crystal).
- **One Shop per Good category.** One file each under `assets/defs/buildings/`, in a new build menu section `build.shops`, ordered by `order`. A Shop sells only Goods of its category.
- **Tiers.** Four per Shop. Per Tier: model (when assets exist), `maxSlots`, the Goods it sells, sales cadence, Jobs, `upgradeCost` (Urbs and Goods, like the Workshop). Values balanced later in the assets editor.
- **Sellable Goods.** Explicit list per Shop Tier in the Shop file. Only Goods are sold in Shops; Materials still go to the Market.
- **Unlocks.** Construction 0 Citizens, Food 50, Equipment 150, Luxury 400 (to balance).
- **General shop.** The current Shop becomes the General shop: still buildable, tied to every category, sells the union of the specialised Shops' Goods at the same Tier (written out in its file, not computed). Its id stays `shop`, so saves and the Shop count in existing cities are untouched. Purchase cost, Tier upgrade costs and extra Slot prices are x2, through a `slotPriceFactor` field (default 1) and its own `cost` / `upgradeCost`.
- **Saves.** Existing Shops keep the id `shop`, now the General shop, at their Tier 1: no save migration needed beyond checking it.
- **Packed Crops.** They are Food Goods, always sold by a Shop that sells Food (Food and General).
- **Tutorial.** Uses the Construction shop (the General shop now costs 600 Urbs).

## Amendment to ADR 0023

The Goods a Shop sells are listed per Tier in the Shop file, an exception to "unlocks stay on the unlocked object". Recorded in ADR 0024 and in a note on ADR 0023.

## Assets editor (ADR 0021, 0023)

- New building `kind: "shop"` in the zod schema with `tiers[]`, `goodCategory`, `slotPriceFactor`; regenerate `.schema.json` and id unions (stale-file test must pass).
- `category` added to `good.schema.json`.
- `src/schema/fields.ts`: labels for every new field. `src/schema/fieldDocs.ts`: hover doc for every new field.
- `src/store/edits.ts`: defaults when creating a Shop and a Good (category required).
- Tiers view (`src/ui/tiers/unlocks.ts`): show a Shop Tier's Goods.
- Reference validator: each listed Good exists and matches the Shop's category (General exempt).
- Descriptions: ICU placeholders declared in the typed registry for the `shop` kind.
- Tests: extend `fields.test.ts` and `edits.test.ts`.
- One-off script rewrites all definition files in the same commit (no format version): `shop.json` becomes the General shop, every Good gets its category.

## Out of scope

Selling Materials or packed Crops in Shops; per-Shop category choice at runtime.
