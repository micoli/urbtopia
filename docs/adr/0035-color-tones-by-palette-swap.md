# Color tones are palette swaps of one model

Accepted. Amends the per-color models of [ADR 0032](0032-unified-building-art-direction-with-a-shared-module-kit.md).

Repaintable buildings were stored as four models each (`-tone-a` to `-tone-d`, plus the solar twins of the Homes): 596 of the 1 138 model definitions, 664 `.glb` files. A color only changed which palette cell a role (wall, roof, accent) pointed to.

A repaintable building is now one model per Tier. The roles that change use role cells (`vtone1` to `vtone3`) of the palette; the build writes one palette PNG per other tone next to the model, and Repaint swaps the palette texture at runtime, as the game already did for the Kenney kits. A model declares its tones in `models.json` (`tones`); saves keep holding only `colorVariant`, so no save changes.

- Why: about 450 fewer models and as many recipes, a fifth color is a table row, and Repaint can preview a color.
- Cost: the colors that vary must be role cells; a sign text keeps the ink of tone a for every tone; palettes are loaded without filtering so cells never blend.
- Rejected: tinting the material (it multiplies every cell at once), a vertex-color pipeline (a rewrite of every model for no gain over a palette swap).
