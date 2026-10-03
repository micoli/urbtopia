# Upgrade UI, per-Tier models and i18n

Status: resolved
Blocked by: 01, 05

Spec: `.scratch/urbix-evolutions/spec.md`. ADR: `docs/adr/0004-three-unique-storages-and-generic-tier.md`.

## What to build

One upgrade panel for all buildings showing current and next Tier effect, cost, missing Urbs and Goods. Pick Kenney models for Silo, Vault and visual Tier variants.

## Acceptance criteria

- [ ] Panel works on phone, tablet and desktop
- [ ] All new strings in FR and EN
- [ ] Manual check of scene performance with the new models

## Answer

Done, except the manual device check. One `UpgradeSection` component (current Tier, next cost, missing Urbs and Goods, upgrade button) is shared by Home, Workshop, Factory, Storehouse, Silo, Vault, Power plant and Water tower. FR/EN strings are in place. Models: Silo = industrial `building-p` and Vault = `building-s` (their footprint is now 2x1, which these models fit natively); Factory has one model per Tier (b, e, f, l, c), Storehouse switches from `a` to `q` at Tier 4. Workshop keeps a single model: the other workshop models are 1x2 or 2x1 and would need scaling that cannot be judged without looking. Still to do by hand: look at the new models in the scene (orientation, fit) and check the panel on phone, tablet and desktop.
