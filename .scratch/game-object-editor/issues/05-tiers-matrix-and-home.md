# Tiers matrix and Home

Status: ready-for-agent
Spec: [game-object-editor](../spec.md)
Blocked by: 04

Introduce `tiers` with inheritance from the previous Tier and `variants`. Move `HOME_TIERS`, `HOME_FOOTPRINTS`, `HOME_UPGRADE_COSTS`, `HOME_MODELS` and `SOLAR_HOME_MODELS` (variant `solar`, roof panel included) into `home.json`; drop `MAX_HOME_TIER` and the Tier 1 duplication test. Editor: Tiers matrix (inherited greyed, override, add or remove a Tier, column drives the preview), Variants tab, read-only unlocks row.
