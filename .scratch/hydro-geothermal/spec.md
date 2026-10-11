# Hydro and geothermal power plants

Two new clean Power plants, plus an Energy production page in the Codex. Vocabulary: see `CONTEXT.md` (Hydro power plant, Flow factor, Geothermal power plant). No ADR: the allocation order is unchanged (ADR 0005, 0008).

## Hydro power plant

- Game object `assets/defs/buildings/hydroPlant.json`, kind `utility`, section `build.utilities`.
- Model `industrial-building-j` (Kenney, already in `models.json`, footprint 1×2), same model on every Tier.
- Must touch a Water tile (like the Marina). Refused otherwise.
- 3 Tiers, Capacity 14 / 28 / 45. Upgrades cost more than the wind turbine (Urbs and `bricks` / `tools` Goods).
- Output = Capacity × Flow factor × daily factor.
  - Flow factor = `min(1, connected Water tiles / 8)`, 0 without connected Water. Connected set as in `connectedWaterKeys` (Marina).
  - Daily factor: slow sinusoid between 0.8 and 1.0 over 24 h, added to `productionFactors`.
- Unlock about 60 Citizens, about 700 Urbs (check against `balance` and the Water tile unlock at 40).
- Build limit: first copy at the unlock, extra copies at 120 and 240 Citizens. Escalating price (default factor 2).

## Geothermal power plant

- Game object `assets/defs/buildings/geothermalPlant.json`, kind `utility`, section `build.utilities`.
- Model `industrial-detail-tank-large`: file `detail-tank-large.glb` is in `assets/kenney/kenney_city-kit-industrial_2.0.zip` but not yet in `models.json`; extract and register it.
- Free placement.
- 3 Tiers, Capacity 10 / 20 / 32, constant (factor 1 at every hour). Upgrades cost more than the wind turbine.
- Unlock about 150 Citizens, about 1500 Urbs.
- Build limit: first copy at 150, extra copies at 300 and 600 Citizens. Escalating price.

## Rules shared by both

- Both join the renewable pool of `energyStats`: served before coal, and their surplus charges Neighborhood batteries.
- No running cost in Urbs, no emissions, no Well-being effect.
- New building types only: no save version bump, old saves stay valid.

## Energy stats

- `energyStats` exposes `hydro` and `geothermal` next to `solar` and `wind`.
- `EnergySection` (management stats): rows for both; the 6 h forecast shows the four factors.

## Codex

- Entries for both buildings, EN and FR names and descriptions, images in the Codex manifest (regenerate).
- `LevelFacts`: Capacity per Tier; hydro also shows the touch-water constraint and the 8 Water tiles; a Production profile fact (stable / variable) on wind, solar, hydro and geothermal.
- New dynamic page `EnergyProductionPage`, opened from a button at the top of the `build.utilities` section (third `page` value `'energy'` in `CodexPanel`), one component per file (rows in `EnergyProductionRow`).
  - Live table per source (wind, solar, hydro, geothermal, coal): copies owned, installed Capacity, current factor, current output, share of Demand covered.
  - City totals: Demand, production, unmet, surplus, battery storage.
  - 24 h forecast per source from the hourly factors.
  - Hydro: connected Water tiles of each plant and resulting Flow factor.
  - Intro text on the dispatch order: renewables, coal, batteries, backup.
  - One stepper, "connected Water tiles" (1 to 20), showing the Flow factor and effective Capacity of the hydro plant per Tier.
