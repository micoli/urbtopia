# 18: Parcel expansion

**What to build:** The player buys adjacent Parcels with Urbs to grow the buildable area.

**Blocked by:** 14

**Status:** resolved

- [x] The map is 128x128 tiles, 8x8 Parcels; the player can buy only Parcels adjacent to an owned Parcel
- [x] Cost is 300 Urbs x 1.12^n (n = Parcels bought so far), rounded to ten, from a data table
- [x] Buyable Parcels are highlighted in the scene with their price; purchase needs confirmation
- [x] Newly owned Parcels become buildable immediately
- [x] Core tests cover pricing sequence, adjacency rule and insufficient Urbs
