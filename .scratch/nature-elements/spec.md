# Nature elements

Status: ready-for-agent

## Confirmed scope

- Add constructible natural elements from Kenney Nature Kit and Mini Forest, including rocks.
- Also include palms and grass from Kenney Pirate Kit.
- Include Nature Kit flowers and trees; exclude every Nature Kit tree model whose filename contains `detailed` (case-insensitive).
- Place each natural element individually so the player can compose gardens and forests.
- Include the new elements in the in-game Codex.
- Unlock availability according to Citizen thresholds.
- Greenery must provide strong positive ecological effects and improve Citizen well-being.

## Verified asset candidates

- Pirate Kit palms: `palm-bend`, `palm-straight`; the archive also contains detailed palm variants, with their selection still unspecified.
- Pirate Kit grass: `grass`, `grass-patch`, `grass-plant`, `patch-grass`, `patch-grass-foliage`.
- Nature Kit flowers: `flower_purpleA/B/C`, `flower_redA/B/C`, `flower_yellowA/B/C`.
- Nature Kit trees: retain non-detailed tree models, including standard palms and pines.
- Exclude Nature Kit `tree_detailed*`, `tree_palmDetailed*` and `tree_pineTall*_detailed`.

## Existing domain rules

- Green spaces provide local cooling, biodiversity and well-being, with diminishing returns.
- Green spaces do not cancel emissions.
- Current trees unlock at 6 Citizens and small parks at 15 Citizens.
- Current well-being provides a bounded Tax benefit of up to 10%.

## Implementation decisions

Implementation was requested with the following initial balancing choices. Values are game indicators, not scientific measurements.

| Family | Urbs | Citizens | Radius | Cooling weight | Biodiversity weight | Well-being weight |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Trees | 60 | 6 | 5 | 3 | 2 | 2 |
| Grass | 20 | 6 | 3 | 1 | 1 | 1 |
| Shrubs and cactus | 35 | 15 | 4 | 1 | 2 | 1.5 |
| Flowers, mushrooms and lilies | 30 | 15 | 4 | 0.5 | 3 | 2 |
| Rocks, logs and stumps | 25 | 15 | 4 | 0 | 2 | 0 |
| Conifers and Mini Forest trees | 90 | 32 | 6 | 4 | 3 | 3 |
| Palms | 100 | 60 | 6 | 3 | 3 | 3 |

- All new models occupy one tile, require owned unoccupied land, and need no road, power, water or maintenance.
- Family variants unlock together. Availability follows the current Citizen count; if population falls, existing elements remain usable, movable and sellable, but new placement locks again.
- Vegetation touching other vegetation receives the existing 20% connectivity bonus. Rocks, logs and stumps contribute only when vegetation is within Manhattan distance two; they do not increase vegetation connectivity.
- Each indicator keeps the existing diminishing-return formula and its 100-point limit. The Tax benefit remains capped at 10%; nature never cancels emissions.
- Retain existing trees and composed parks for saved-city compatibility; new construction is individual.
- Include every non-detailed Nature Kit tree, flowers, grass, bushes, cactus, lilies, mushrooms, rocks, stones, logs and non-detailed stumps. Terrain/cliff/river modules and manufactured props are outside this individual-element feature.
- Mini Forest contributes its two trees, plant, grass patch and four rock/stone models.
- Pirate contributes its two standard palms and all five grass models; detailed palms are omitted to keep the selected style consistent.
- One Codex entry and generated model preview per constructible; translated FR/EN names and family descriptions explain range and ecological effects.
- Fit and ground models within their one-tile footprint, preserving proportions.
- Save version 7 accepts the new constructible types. Version 6 migrates unchanged; previous trees and parks keep their balancing.

## Validation

- Public test seams confirmed by the user: placement/move/sale commands, ecological benefit calculations, save serialization/loading and Codex catalog.
- TDD checks cover three-pack Codex coverage, stronger local benefits, habitat proximity, unlocks and save version compatibility.
- Every natural model is covered by a save round-trip test.
- Final full-suite, build and two-axis review results will be recorded at delivery.

## Sources

- https://kenney.nl/assets/nature-kit
- https://kenney.nl/assets/mini-forest
- Local archive: `assets/kenney/kenney_pirate-kit.zip`
- ../ecological-city/balancing.md
