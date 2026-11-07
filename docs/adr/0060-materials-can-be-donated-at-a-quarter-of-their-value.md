---
status: accepted
---

# Materials can be donated at a quarter of their value

Extends the Donation of Goods to Materials. Selling Materials to the Market was considered and rejected; this ADR records why donating them is different.

**The need.** A Material produced in excess, with the Storehouse full, had nowhere to go. The Market buys only Goods, and a Donation took only Goods, so the surplus was wasted.

**Materials are not sold.** The Market stays a buyer of Goods. Selling Materials would short-circuit the chain: a raw Material turned into Urbs with no Factory, no Packhouse and no Slot, which empties those buildings of purpose, forces a price for every Material to be balanced against every Good that consumes it, and lets a Workshop or a Fishing boat feed an almost passive income. A Donation creates no Urbs, so none of this applies.

**A Material counts for 25% of its base value, rounded down.** A Material is worth 4 to 10 times less than a Good (median 8 against 34 in the definitions), so the reserve and the Medal already fill slowly from Materials. The 25% share keeps a Good worth more than the Materials of its recipe donated as they are, so a Factory remains the better way to give. The value is the same for the Solidarity reserve and for the Medal: the server receives only a `value` and does not know the kind of item, so there is no separate Medal weight and no change to the database.

**Crop Materials cannot be donated.** Their base value is 0, so their Donation value rounds to 0 and the command is refused. This keeps Corn, Wheat and Mulberry leaves, which are Feed, from being given away by mistake. The Market list shows only Materials whose stock gives a Donation value above 0.

**No daily cap.** The reserve is capped at 24 hours; any value above the cap still counts for the Medal only, as for Goods, and the preview says so. This is the limit on the surplus a Donation can absorb.

**One command.** `DonateGoods` becomes `DonateItems` with an `item` that is a Good or a Material; it draws on the matching compartment of the stock. The saved `donations` records are unchanged, so no save migration is needed.

**Consequences.** A Workshop surplus has a use, but giving Materials never replaces the Goods for the Medal: about 500 median Materials are needed for the first 1,000 against about 30 median Goods. Animal Materials (Eggs, Milk, Wool, Silk) can be donated, since their value is above 0. If the Medal pace from Materials proves too fast, `SOLIDARITY.materialShare` is the single value to lower.
