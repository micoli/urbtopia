# Dairy, Textile mill and Knitwear factory

Status: resolved
Blocked by: 01

Three Production buildings on the existing production balance (5 Tiers).

- Dairy (Factory, Counter): Milk -> Cream, Cheese; Goat milk -> Goat cheese. Unlock 150.
- Textile mill (Mill kind, no Counter): Wool, Alpaca wool, Silk -> Textile. Unlock 250.
- Knitwear factory (Factory, Counter): Textile -> Sweater, Gloves, Hat, Scarf. Unlock 400.
- Counters follow ADR-0044 and list only their own Goods.
- Done when: a chain Wool -> Textile -> Sweater runs end to end in a test.

## Answer

`dairy.json` and `knitwearFactory.json` (production, Counter of their own Goods, 3 sales Slots), `textileMill.json` (Mill kind, no Counter). Dairy and Textile mill scale recipes with yield like the Bakery and Mill; the Knitwear factory like the Factory. Unlocks 150 / 250 / 400 Citizens, all in `build.production`. Placeholder models reuse the Bakery, windmill and Factory tier-1 models until issue 07. Chain test in `clothingChain.test.ts`.
