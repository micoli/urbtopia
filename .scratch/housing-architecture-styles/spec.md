# Housing architecture styles

Visual-only skins of the existing Homes, inspired by world architecture. Same Tiers, footprints, citizens, power, water, cost, unlock threshold and upgrade costs as the base Home; only the models (and names/descriptions) change.

## Scope

32 styles, 480 models: every model has a `-solar` twin (the codex and the build menu require a Solar variant for every Home definition, found with the pilot). One model per Tier carries the four color tones through palette cells.

| Base definition | Tiers x footprints | Models per style | Styles | Models |
|---|---|---|---|---|
| `home` (suburban, 8 Tiers: 1x1, 2x1, 2x1, 2x1, 2x2 x4) | 8 | 8 | 19 | 152 |
| `home-mansard-1x1` + `home-mansard-1x2` | 5 + 5 | 10 | 5 | 50 |
| `home-mansard-1x2` | 5 | 5 | 2 | 10 |
| `home-mansard-2x2` | 5 | 5 | 5 | 25 |
| `home-building` (tower, 3 Tiers, 1x1) | 3 | 3 | 1 | 3 |

## Styles

Model ids follow the existing scheme with a style slug: `house-<w>x<d>-<n>f-<style>-a` (tower: `tower-1x1-<n>f-<style>-a`).

| # | Style (slug) | Inspiration | Base | Models | Reference image (Wikimedia Commons) |
|---|---|---|---|---|---|
| 1 | Dutch canal house (`dutch`) | Amsterdam | mansard 1x1 + 1x2 | 10 | https://commons.wikimedia.org/wiki/File:Amsterdam_(NL),_Oudezijds_Kolk_--_2015_--_7264.jpg |
| 2 | Haussmannian (`haussmann`) | Paris | mansard 2x2 | 5 | https://commons.wikimedia.org/wiki/File:2011_Paris,_Boulevard_Hausman.jpg |
| 3 | Tudor half-timbered (`tudor`) | England, Germany | home | 8 | https://commons.wikimedia.org/wiki/File:Lingfield_Public-_Half_timbered_Tudor_building_in_Church_Road_(geograph_5799245).jpg |
| 4 | Whitewashed Mediterranean (`aegean`) | Santorini, Andalusia | home | 8 | https://commons.wikimedia.org/wiki/File:White_houses_of_Oia_on_Santorini_(52181448879).jpg |
| 5 | Tuscan villa (`tuscan`) | Italy | home | 8 | https://commons.wikimedia.org/wiki/File:Hillside_Farmhouse_at_Sunset.jpg |
| 6 | Machiya (`machiya`) | Kyoto | mansard 1x2 | 5 | https://commons.wikimedia.org/wiki/File:Kyoto_machiya,_Roji_2013.png |
| 7 | Gassho minka (`gassho`) | Shirakawa-go, Japan | home | 8 | https://commons.wikimedia.org/wiki/File:Shirakawa_Gassho-zukuri_14.jpg |
| 8 | Siheyuan (`siheyuan`) | Beijing hutong | mansard 2x2 | 5 | https://commons.wikimedia.org/wiki/File:Hutong_(50587286241).jpg |
| 9 | Stilt house (`stilt`) | Southeast Asia, Amazonia | home | 8 | https://commons.wikimedia.org/wiki/File:DSCF1090_A_peaceful_wooden_stilt_house_shaded_by_a_leaning_tree_reflected_in_the_calm_waters_of_a_riverside_canal.jpg |
| 10 | Riad (`riad`) | Morocco | home | 8 | https://commons.wikimedia.org/wiki/File:Riad_Laksiba-open-air-courtyard_Marrakech.jpg |
| 11 | Colonial pastel (`colonial`) | Colombia, Brazil | mansard 1x1 + 1x2 | 10 | https://commons.wikimedia.org/wiki/File:Baroque_Colonial_houses_at_Cartagena_de_Indias_ca._1850-1930.jpg |
| 12 | Brownstone (`brownstone`) | New York | mansard 1x2 | 5 | https://commons.wikimedia.org/wiki/File:Harlem,_New_York_brownstones.jpg |
| 13 | Painted Victorian (`victorian`) | San Francisco | home | 8 | https://commons.wikimedia.org/wiki/File:Painted_Ladies_San_Francisco_January_2013_panorama_2.jpg |
| 14 | Alpine chalet (`chalet`) | Switzerland, Austria | home | 8 | https://commons.wikimedia.org/wiki/File:Chalet_Beuil_bois.jpg |
| 15 | Scandinavian stuga (`stuga`) | Sweden, Norway | home | 8 | https://commons.wikimedia.org/wiki/File:Falu_red_cottage_next_to_Myrstigen_1.jpg |
| 16 | Brutalist tower (`brutalist`) | Brasilia, Mexico City | tower | 3 | https://commons.wikimedia.org/wiki/Category:Brutalist_architecture_in_Brazil |
| 17 | Tulou (`tulou`) | Fujian, China | mansard 2x2 | 5 | https://commons.wikimedia.org/wiki/File:Tulou_from_Fujian_-_Aug_2022.jpg |
| 18 | Turf house (`turf`) | Iceland | home | 8 | https://commons.wikimedia.org/wiki/File:Turf_houses_in_Glaumb%C3%A6r_open-air_museum,_Iceland,_20240715_1416_0882.jpg |
| 19 | Rondavel (`rondavel`) | Southern Africa | home | 8 | https://commons.wikimedia.org/wiki/File:Qolora_Wild_Coast_braai_rondavel_Oct_2018.jpg |
| 20 | Sahelian banco (`banco`) | Djenne, Mali | home | 8 | https://commons.wikimedia.org/wiki/File:Djenn%C3%A9,_Mali.jpg |
| 21 | Tata Somba (`tata`) | Togo, Benin | mansard 2x2 | 5 | https://commons.wikimedia.org/wiki/File:Tribu_Somba.jpg |
| 22 | Painted Ndebele (`ndebele`) | South Africa | home | 8 | https://commons.wikimedia.org/wiki/Category:Ndebele_architecture |
| 23 | Swahili stone house (`swahili`) | Zanzibar | mansard 1x1 + 1x2 | 10 | https://commons.wikimedia.org/wiki/File:Door_-_Stone_Town-6.jpg |
| 24 | Fale (`fale`) | Samoa, Polynesia | home | 8 | https://commons.wikimedia.org/wiki/File:Fale_O_Samoa,_M%C4%81ngere_PA01.jpg |
| 25 | Whare (`whare`) | New Zealand (Maori) | home | 8 | https://commons.wikimedia.org/wiki/File:Kaitaia_-_Whare_(Maori_Building).jpg |
| 26 | Queenslander (`queenslander`) | Australia | home | 8 | https://commons.wikimedia.org/wiki/File:Queenslander_Verandah.jpg |
| 27 | Maloca (`maloca`) | Amazonia | mansard 2x2 | 5 | https://commons.wikimedia.org/wiki/File:Maloca_ind%C3%ADgena_Cubay_-_panoramio.jpg |
| 28 | Chiloe palafito (`palafito`) | Chile | home | 8 | https://commons.wikimedia.org/wiki/File:Palafitos_de_Castro.jpg |
| 29 | Andean adobe (`andean`) | Cusco, Bolivia | home | 8 | https://commons.wikimedia.org/wiki/File:Choquechaca_350_San_Blas_Limacpampa.jpg |
| 30 | Totora reed hut (`totora`) | Lake Titicaca | home | 8 | https://commons.wikimedia.org/wiki/File:032_Reed_Houses_Uros_Islands_of_Reeds_Lake_Titicaca_Peru_3085_(15181582482).jpg |
| 31 | Corrugated-iron house (`valparaiso`) | Valparaiso | mansard 1x1 + 1x2 | 10 | https://commons.wikimedia.org/wiki/File:Colorful_Valparaiso_houses.jpg |
| 32 | Quincha balcony house (`quincha`) | Lima, Peru | mansard 1x1 + 1x2 | 10 | https://commons.wikimedia.org/wiki/File:Lima,_Peru_-_Barranco_colonial_house.jpg |

Round or irregular plans (7, 17, 19, 21, 24, 27, 30) fit the square footprint with a cluster of volumes, or a round building inside its square, never by changing the footprint.

## Per-style workflow

1. Recipe: `create-building-model` skill, one recipe per Tier and footprint, sharing one style module (palette cells, roof, window and door vocabulary of the style) so Tiers read as one family.
2. Show every Tier side by side in the live Blender (material shading, `look` angles), plus the isometric game control render of the whole evolution.
3. Gates (`inspect_scene`, `gate_report`, `check_footprint`) on every model.
4. User validates the style (or asks for rounds, three correction rounds at most before asking what is wrong).
5. Register models (`register_model.py`), add the building definition(s) copying Tiers, stats and costs of the base, `npm run defs:generate`, `npx tsc --noEmit`, vitest, lint.
6. Commit the style (one commit per validated style), then next style.

## Open decisions, settled with the pilot style

- Pilot: **Brownstone (12)**: 5 models, one footprint, simple volumes. It settles the pipeline before the 8-model and 10-model styles.
- Game integration: each style is a new `build.housing` definition per base (37 definitions in all). The menu needs grouping (sub-menu by region) or it drowns. Alternative: a style picker on the placed Home, like Repaint. Decide on the pilot.
- Unlock and cost: identical to the base definition (stats and economy unchanged), so every style is available from the same threshold as its base.
- Names and descriptions: English and French per definition; add the glossary term to `CONTEXT.md` (Architecture style) and avoid any trademarked game vocabulary.
- Hardcoded Mansard assumptions (`src/scene/mansardHomes.test.ts`, `renderItems.ts`) to generalize when the first Mansard-based style lands.

## Order after the pilot

Europe (1, 2, 3, 5, 14, 15, 18), Mediterranean and North Africa (4, 10), Asia (6, 7, 8, 9, 17), Africa (19, 20, 21, 22, 23), Oceania (24, 25, 26), Americas (11, 13, 27, 28, 29, 30, 31, 32), then 16.
