# Achievements

Status: ready-for-agent

## Problem

The game has many features (transports, interiors, politics, the Architect office…) and nothing tells a player which ones they have not tried. The aim is to push the player to use every feature once.

## Decisions

Vocabulary (Achievement, Achievement category, Medal) in `CONTEXT.md`. Architecture in [ADR 0094](../../docs/adr/0094-achievements-are-latched-by-event-and-kept-in-the-city-save.md).

- An Achievement is a feature used at least once in a City. Binary, no counter, no Urbs, never taken back.
- Two levels: Achievement category → Achievement. A category is complete when all its possible Achievements are, and then earns a Medal (server, Player account, once per category).
- Acquired per City, stored in its save. Latched by event through the Command gateway (player Commands and simulation results); nothing in a Visit; nothing from a Replan; Tutorial counts; Catch-up counts simulation results and lists them in its summary.
- Display: an "Achievements" window from the main menu (categories with a completion bar, Achievements below, each with a link to its Codex page). A toast on each unlock and a separate toast for a Medal.
- All Achievements are visible from the start, with the Citizens threshold or Difficulty they need. One impossible in the City's Difficulty is greyed and left out of the completion; a category with none possible is hidden and gives no Medal.
- Existing saves are seeded once, silently, from what the state proves, then one summary toast.
- Data-defined: id, category, trigger type and parameters, FR/EN texts. A test checks that every id has both texts and that every trigger parameter exists in the game definitions. The wording below is a first draft for review; ids are resolved against the game definitions when built.

## Trigger types (closed set)

`placed` (a building or element type is placed), `created` (a line, a plan, a Stash…), `command` (a named player action), `sim` (a simulation result), `threshold` (a metric reaches a value).

## Catalogue (draft)

"Retro" = the state of an existing City can prove it, so seeding applies.

### 1. Production and economy
| Achievement (EN / FR) | Trigger | Retro |
|---|---|---|
| First harvest / Première récolte | sim: Harvest | no |
| Workshop at work / Atelier en marche | placed: Workshop | yes |
| Open for business / Ouvert aux affaires | placed: Shop | yes |
| Stocked up / Entrepôt garni | placed: Storehouse | yes |
| Goods on the Market / Biens sur le Market | command: Market sale or Trade offer | no |

### 2. Housing and growth
| Achievement | Trigger | Retro |
|---|---|---|
| First Home / Premier Home | placed: Home | yes |
| Home upgraded / Home amélioré | command: Tier upgrade | no |
| A school for the Citizens / Une école pour les Citizens | placed: Schooling building | yes |
| Culture at hand / La culture à portée | placed: Library | yes |
| A thousand Citizens / Mille Citizens | threshold: Citizens 1000 | yes |

### 3. Transport
| Achievement | Trigger | Retro |
|---|---|---|
| First road / Première route | placed: Road | yes |
| Bus line / Ligne de bus | created: Bus line | yes |
| BRT corridor / Couloir BRT | created: BRT corridor | yes |
| All aboard the Train / En voiture, le Train | created: Railway line | yes |
| Under the city / Sous la ville | created: Metro line | yes |
| Bridge builder / Bâtisseur de ponts | placed: Bridge | yes |
| Foot and wheel / À pied et à vélo | placed: Pedestrian way or Cycling lane | yes |

### 4. Interiors
| Achievement | Trigger | Retro |
|---|---|---|
| Behind the door / Derrière la porte | command: open an interior | no |
| Staffed / Du personnel | command: assign Staff | no |
| First Machine / Première Machine | placed: Fixture of role Machine | partly |
| Driven by Drive / Entraîné par la Drive | sim: a Machine runs on Drive | no |
| Guided demonstration / Démonstration guidée | command: finish a Guided demonstration | no |
| Furnished Home / Home meublé | placed: Fixture in a Home interior | yes |

### 5. Energy and water
| Achievement | Trigger | Retro |
|---|---|---|
| Power on / Courant rétabli | placed: Power plant | yes |
| Engine room at work / Salle des machines en marche | sim: an Engine room produces | no |
| Clean power / Énergie propre | placed: Hydro or Geothermal power plant | yes |
| Sun on the roof / Du soleil sur le toit | command: Solar installation | no |
| Water tower / Château d'eau | placed: Water tower | yes |

### 6. Politics (absent under Cozy)
| Achievement | Trigger | Retro |
|---|---|---|
| Town hall open / Hôtel de ville ouvert | placed: Town hall | yes |
| Ordinance passed / Ordinance adoptée | command: enact an Ordinance | no |
| Objective met / Objective atteint | sim: an Objective held | no |
| Grant claimed / Grant réclamé | command: claim a Grant | no |
| Re-elected / Réélu | sim: an Election won | no |

### 7. Architect
| Achievement | Trigger | Retro |
|---|---|---|
| Planning office / Bureau de planification | placed: Planning office | yes |
| House plan / Plan de maison | created: House plan | no |
| District plan / Plan de quartier | created: District plan | no |
| A home of the city / Un home de la cité | sim: a plan becomes a Home | no |

### 8. Leisure and tourism
| Achievement | Trigger | Retro |
|---|---|---|
| Try your luck / Tentez votre chance | command: play a Minigame Round | no |
| Show time / Le spectacle commence | sim: a Gathering took place | no |
| A club of your own / Un club à vous | created: Club | no |
| Visitors arrive / Les Visitors arrivent | placed: Attraction | yes |
| Set sail / Cap sur la mer | placed: Marina | yes |

### 9. Environment
| Achievement | Trigger | Retro |
|---|---|---|
| Waste collected / Déchets collectés | placed: Waste facility | yes |
| Recycling / Recyclage | placed: Recycling plant | yes |
| Green space / Espace vert | placed: Green space | yes |
| Land value / Valeur du terrain | command: open the Land value Layer | no |

### 10. Social
| Achievement | Trigger | Retro |
|---|---|---|
| A Handle of your own / Un Handle à vous | command: set a Handle | no |
| Friend request / Demande d'ami | command: send a Friend request | no |
| Trade offer / Trade offer | created: Trade offer | no |
| Donation / Donation | command: make a Donation | no |
| Challenge accepted / Challenge relevé | command: accept a Challenge | no |
| Visit / Visite | command: Visit a Showcase | no |

### 11. City management
| Achievement | Trigger | Retro |
|---|---|---|
| Second City / Seconde City | created: a second City | no |
| Replan / Replan | command: finish a Replan | no |
| Cloud save / Cloud save | command: first Cloud save | no |
| Time skip / Time skip | command: Time skip | no |
| Analytics view / Analytics view | command: open the Analytics view | no |
| Ask the Advisor / Demander à l'Advisor | command: question the Advisor | no |
| Read the Codex / Lire le Codex | command: open a Codex page | no |

## Out of scope

Urbs or item rewards, per-account Achievements, counters or tiers of Achievements, a ranking by Achievements, server-side verification, hidden Achievements.

## Issues

1. [Engine, save and first category with the window](issues/01-engine-save-and-first-category.md)
2. [Toasts](issues/02-toasts.md) (after 01)
3. [Seeding of existing saves](issues/03-seed-existing-saves.md) (after 01)
4. [Medal of a category](issues/04-category-medal.md) (after 01)
5. [Categories 1, 2, 4 and 5](issues/05-categories-production-housing-interiors-energy.md) (after 01)
6. [Categories 3, 8 and 9](issues/06-categories-transport-leisure-environment.md) (after 01)
7. [Categories 6 and 7](issues/07-categories-politics-architect.md) (after 01)
8. [Categories 10 and 11](issues/08-categories-social-city-management.md) (after 01)
9. [Guide article](issues/09-guide-article.md) (after 05 to 08)
