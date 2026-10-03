# 20: Home Tier upgrades

**What to build:** The player upgrades Homes from Tier 1 to Tier 6 by paying Urbs and Goods, and the city visibly grows.

**Blocked by:** 19

**Status:** resolved

- [x] Upgrade is instant and one Tier at a time; Goods are taken from the Storehouse; new Citizens appear immediately
- [x] Tiers 1 to 6 house 6, 15, 32, 60, 100, 160 Citizens with Demand 1, 2, 3, 6, 10, 16
- [x] Upgrade costs: T2 150 Urbs + 3 Planks; T3 400 + 4 Bricks + 2 Planks; T4 1,000 + 4 Tiles + 3 Bricks; T5 2,500 + 4 Tools + 3 Tiles; T6 6,000 + 4 Glass + 3 Circuits (data table)
- [x] Upgrade is refused with an explicit message if Demand would exceed Capacity or if Urbs or Goods are missing; the panel shows what is missing
- [x] Each Tier uses its suburban model from the asset catalog
- [x] Selling a Home refunds 75 % of placement cost only; confirmation required for Tier 3 and above
