# Politics

Status: needs-triage

The player becomes the **Mayor**. A simulated **Council** votes on the Mayor's **Ordinances**, the State pays **Grants** for held **Objectives**, and Citizens voice **Petitions** and **Support** that feed the **Approval**. Vocabulary: see `CONTEXT.md` (**Mayor**, **Council**, **Faction**, **Approval**, **Term**, **Election**, **Ordinance**, **Objective**, **Grant**, **Petition**, **Support**, **Demonstration**, **Politics window**, **Difficulty**, **Sanction**, **Adaptation period**).

## Principles

- Gentle consequences only: politics never removes Citizens, never ends the game, never removes the Mayor role, and never touches Tax or Sanctions (the Sanction stays the only fiscal malus).
- Deterministic: a vote is forecast before it is proposed, with no luck and no buying of votes. Every draw (Election, Petition generation) uses the politics' own stream of the game's Seed, so reloading never dodges it.
- Data, not code: Ordinances and Objectives are Game objects defined by data and validated by generated JSON schemas (ADR 0021); the rules that use their values stay in code (ADR 0023).
- Built on existing systems only: no new simulated resource.
- Nothing recalls traditional politics: no left/right axis, no real party, no named person.

## Activation

- Politics exists only once a **Town hall** is built, and only from **Easy** Difficulty. Under Cozy there is none (no Council, no Approval, no Grants, no Petitions), and a city saved before politics stays untouched.
- An **Adaptation period** follows the first activation: no Demonstration and no Approval penalty during it.
- Gradation by Difficulty:
  - Easy: Council, Ordinances, Objectives, Grants; Petitions and Support are informative only.
  - Medium: adds the escalation of ignored Petitions into Demonstrations, and the Election.
  - Hard: the Approval also modulates the amount of Grants and the goodwill of the Council.
- Every Difficulty-dependent value lives in one Balance table read by the core and by the Codex page (as for Sanctions, ADR 0029).

## Approval

- Between 0 and 100, per city.
- Each game day it moves toward the mean Well-being of the Homes weighted by Citizens.
- One-off shocks that fade: Ordinance adopted or repealed (a popular one repealed costs a little), Petition handled (bonus), Demonstration (malus).
- It never alters Tax or Sanctions. It acts only on Grants (Hard) and on the Council's goodwill (Hard).

## Council, Factions, Ordinances

- Three abstract Factions with a fixed number of seats: Economy, Environment, Services. The Election moves the seats.
- Shown as a **circle** of seats, with no left and no right, no ordering of Factions, no hemicycle.
- An **Ordinance** is a Game object (cost, daily upkeep, effect, unlock by Citizens, the concern of each Faction). Launch catalogue (about seven): Tax level (3 levels), Waste sorting, Green belt, subsidised public transit, energy saving, Office relief, Cultural festival.
- The Mayor proposes an Ordinance. Each Faction votes according to the effect of the Ordinance on its concern; the forecast by Faction is shown before proposing. Adopted: daily upkeep in Urbs. Rejected: it can be proposed again after a delay.
- Only adoption goes through the Council. Repeal is free and immediate.

## Objectives and Grants

- Objectives are a catalogue defined by data over existing measures: Vital Need level threshold, full Waste coverage, Congestion under a threshold, Green space share, Citizens milestones.
- Three Objectives are active at a time, in rotation. An Objective held for a period yields a **Grant** in Urbs, claimed by hand like Tax.
- A Grant is fixed on Easy and Medium and modulated by the Approval on Hard only.
- Judged on the game clock, replayed by Catch-up.

## Petitions, Support, Demonstrations

- Generated from the existing Need factors, localised (the cause and the district named, e.g. uncollected Waste here).
- Handling a Petition (fixing its cause) raises the Approval. Medium and above: an ignored Petition escalates into a Demonstration, which only lowers the Approval.
- Support is the mirror for good results.

## Term and Election (Medium and above)

- A Term has a fixed length in game days. At its end an Election, drawn from the politics' Seed stream, decides how favourable the next Council is from the Approval. Losing never takes the city from the player.

## Save and replay

- The politics is its own block of the save (day of the Term, seats, adopted Ordinances, Objective progress, open Petitions, Approval). An absent block means no politics, so older saves load without a heavy migration (ADR 0003).
- Time skip and Catch-up replay the politics in full (Petitions escalate, Elections take place, Objectives are judged) and show a summary on return (ADR 0002).
- Cloud save and conflict comparison carry the block.

## Interface

- **Town hall panel**: one status line (Approval, Term) and two buttons: open the Politics window, open the Codex page.
- **Politics window**: first section is the **summary** of the current state (Approval, remaining days of the Term, Council forecast, active Objectives, open Petitions); then Council (circle), Ordinances, Objectives, Petitions. It links to the Codex page and does not repeat the rules.
- **Codex page "Politics"** in the `build.publicFacilities` section, next to Sanctions and Waste, opened from the Town hall panel as the Waste page is from Waste facilities. It details every rule above, fully derived from the Balance table and the live state, in French and English.

## Out of scope

Named parties or characters, buying votes, campaign mechanics, Citizen loss, game over, impeachment, multiplayer or server-side politics, new resources.

## Issues

See `issues/`.
