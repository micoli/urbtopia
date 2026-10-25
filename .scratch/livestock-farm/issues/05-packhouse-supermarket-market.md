# Packhouse inputs, Supermarket shelves and Market for the new items

Status: resolved
Blocked by: 01, 02

- Packhouse packs hen/duck eggs, milk and honey into packed Goods (Food).
- Every new Good can be stocked on a Supermarket Shelf and bought by the Market; Mulberry leaves are not packable nor bought.
- Done when: eggs go from a Livestock farm to a packed Good sold in the Supermarket in a test.

## Answer

The Packhouse already packs every Material with a `packing` entry (issue 01: hen eggs, duck eggs, milk, honey), as Food. Supermarket Shelves and the Market accept any Good, so the new Goods sell there unchanged; mulberry leaves, wool, silk, goat milk and fabrics are not packable and not Goods. Added the new Goods to the shop lists: Grocery (cream, cheese from Tier 2, goat cheese Tier 3), Equipment shop (gloves, hat Tier 2, sweater Tier 3, alpaca sweater Tier 4), Luxury shop (scarf Tier 3) and the General shop. Tests in `animalGoodsSales.test.ts` and `supermarket.test.ts`.
