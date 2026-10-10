# Casino

Status: resolved
Spec: [game-object-editor](../spec.md)
Blocked by: 05

`CASINO` (upgrade costs, footprints, radii, Well-being bonus, max Stakes, power unfolded from `casinoPower`), `CASINO_MODELS`, `BLOCKMATCH_LEVEL_BY_TIER` into `casino.json`; Minigames keep `minTier` on their own entry. Casino boat stays aligned (same Tiers).

## Comments

Delivered (2026-10-09):

- The Casino is a `casino` kind: Stake steps and the minimum Tier of each Minigame at the root; Tiers with model, footprint, radius, Well-being bonus, highest Stake, power (unfolded from the former growth formula: 6, 9, 13.5) and blockmatch level.
- `CASINO`, `MAX_CASINO_TIER`, `casinoPower` and `blockmatchLevelNumber` read the file, so the Casino boat keeps following the same Tiers; `CASINO_GAMES` lives in `casinoGames.ts`. The Casino models per Tier and the footprint special case are gone.
- Editor: Casino defaults and a comma-separated number list control (Stake steps).
