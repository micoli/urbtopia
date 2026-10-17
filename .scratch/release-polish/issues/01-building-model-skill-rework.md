# Rework the building model skill for the game

Status: in progress
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [ ] A shared kit of modules (walls, roofs, windows, doors) in the `urbtopia` style, reused by every recipe, with common proportions per footprint and floor count.
- [ ] One locked palette; a triangle budget per footprint size, checked by the skill.
- [ ] A standard control render at the game's isometric angle, using the target lighting of [ADR 0034](../../../docs/adr/0034-zero-cost-lighting-on-mobile.md) (directional, hemisphere, tone mapping, light fog). Done for the angle and the current lighting; the target lighting (fog, blob shadows) does not exist yet and is added to `game_render.py` with issue 10.
- [x] Output `<id>.blend`, `<id>.glb` and the Python recipe in `assets/managed-models/buildings/`, with the Model definition registered in `assets/models.json` without renaming an existing Model id.
- [x] The 122 existing managed models still regenerate, or are listed as to be replaced. 120 regenerate with an identical `.glb` and within budget; `marina-captaincy` and `marina-captaincy-narrow` are hand-written scripts needing `--out`, replaced in lot 05.
- [x] The skill documents how `add-building` takes over for registering the game object.

## Progress

Done: the Blender toolkit extracted from the personal `blender-lpm-skill` into `tools/blender/` (no Unity export, glTF only; all recipes now load it from the repository, and the two marina scripts, which were not reproducible, are now byte-identical); `scripts/game_render.py` (game camera and lighting), `scripts/register_model.py`, SKILL.md steps, regeneration check. The existing `building_lib.py` already holds a palette of 28 cells, a triangle budget per footprint and floors, and the house, apartment and office kit.

Left: extend the kit to the archetypes of lots 04 to 06 (civic, industrial, shop, utility, venue exteriors), which `building_lib.py` does not cover yet, then tick the two first boxes.
