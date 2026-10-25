# The Bakery sells its Goods over a Counter

The Bakery both produces and sells. Its definition carries an optional `counter` (sales Slots, Goods sold, sale interval factor) that any Production building may declare; the Bakery is the only one that does. The Counter reuses the Shop machinery: the same stacks, the same stocking from the Storehouse, the same sales and earnings, collected with the production by a single Collect.

## Why

- The baked Goods (Bread, Fougasse, Apple cake, Cherry clafoutis) were sold by no Shop, only by the Market and the Supermarket. Players expect a bakery to sell its bread.
- A separate Boulangerie shop building would have duplicated the Bakery's role and its menu entry.

## Consequences

- The Counter has its own fixed number of Slots, apart from the production Slots: buying a production Slot never adds a sales Slot, and a Tier upgrade changes neither.
- Only the Goods listed in the definition can be stocked: no canned fish, no packed Crops.
- A Bakery saved before the Counter has no stacks; they are added the first time the Counter is stocked, so no save migration is needed.
- Collect pays the earnings, then collects the finished production; a full Storehouse never blocks the earnings.

## Alternatives rejected

- A new Shop building for baked Goods: a second building for the same trade, and the Shop glossary ties a Shop to a Good category.
- Add the baked Goods to the Grocery: simpler, but leaves the Bakery unable to sell.
