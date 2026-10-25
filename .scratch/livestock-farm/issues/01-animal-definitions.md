# Animal Materials, Textile and clothing Goods definitions

Status: resolved
Blocked by: none

Add the data defs, with balance placeholders and unlock Citizens from the spec.

- Materials (`assets/defs/materials`): hen egg, duck egg, milk, goat milk, wool, alpaca wool, silk, honey, mulberry leaves, textile. Mulberry leaves use the crops storage compartment; the rest the Storehouse.
- Goods (`assets/defs/goods`): cream, cheese, goat cheese (Food), sweater, gloves, hat (Equipment), scarf (Luxury), plus packed eggs, milk and honey.
- Extend the schemas (`producedBy`, new building kinds) so the editor validates them.
- Done when: defs load, schema tests pass, no entry is meat, hide or leather.

## Answer

Defs added with material ids henEgg, duckEgg, milk, goatMilk, wool, alpacaWool, silk, honey, mulberryLeaf, textile, alpacaTextile, silkFabric and goods cream, cheese, goatCheese, sweater, gloves, hat, alpacaSweater, scarf. No `model` yet (issue 07). Schemas gained the producers livestockFarm, hive, textileMill (materials) and dairy, knitwearFactory (goods). The crops compartment now covers every orchard Material. Textile split into three fabrics (one input per recipe).
