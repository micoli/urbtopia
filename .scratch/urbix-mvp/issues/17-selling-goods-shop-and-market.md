# 17: Selling Goods: Shop and Market

**What to build:** The player earns Urbs from Goods through Shops (regular, full price) and the Market panel (instant, reduced, saturating).

**Blocked by:** 16

**Status:** resolved

- [x] Shop has 3 Slots; each takes a stack of 5 units of one Good from the Storehouse; citizens buy 1 unit per 45 s at 100 % of base value
- [x] Shop earnings accumulate (capped at one stack's value per Slot) and are collected by hand through a collect badge
- [x] Market is a panel, unlocked with the first Good, paying 60 % of base value
- [x] Each unit sold of the same Good lowers its multiplier by 5 points (floor 30 %); recovery is linear, 0 to full in 1 h; no randomness
- [x] Core tests cover Shop timing, Market saturation and recovery with a simulated clock
- [x] Reaching the first sales within about 5 minutes of play is possible with starting numbers
