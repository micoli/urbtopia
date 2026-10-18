# Waste management

Status: Specified, not implemented

Vocabulary is defined in `CONTEXT.md` (Waste, Waste processing, Waste coverage, Carrying distance, Mound, Odor radius, Incinerator, Recycling plant). Decision record: [ADR 0039](../../docs/adr/0039-waste-as-throughput-with-road-linked-coverage.md).

## Confirmed decisions

- Waste is a new Service category and a Public facility family. Missing coverage lowers Well-being and can block Home Tier upgrades. It feeds the Vital Need level and is sanctioned from Easy Difficulty; its odor and pollution also join the Pollution factor from Medium. Cozy has no Sanction.
- Only Homes produce Waste, in proportion to their Citizens (1 unit per Citizen per day), modelled per Home in aggregate. It is derived and never saved.
- Collection is a continuous flow, not a stock. Trucks are visual only.
- Three facilities, each with its own capacity and Tiers: Mound (1×1, 3 Tiers, unlocks at 800 Citizens), Incinerator (4 Tiers, 1000 Citizens), Recycling plant (4 Tiers, 1500 Citizens). Unlock thresholds live in the building definitions.
- A Mound has a daily throughput and never fills. No Build limit on any of the three.
- Order of use: Recycling plant, Incinerator, Mound, whatever the price. Within a facility, nearest Homes first, as for any Service coverage.
- Usage cost in Urbs per unit processed, per facility, relative 1 (Mound) : 3 (Incinerator) : 6 (Recycling plant). Absolute values are calibrated on the real Tax per Citizen so Waste weighs about 10 to 20 % of Tax at Medium Difficulty. A facility whose cost cannot be paid stops processing and its Homes lose coverage; no debt.
- Starting capacities per Tier (units per day): Mound 60 / 120 / 200; Incinerator 800 / 1500 / 2500 / 4000; Recycling plant 400 / 800 / 1400 / 2200.
- Incinerator: local Well-being malus (weaker than coal) and Climate emissions proportional to Waste burnt. Mound: odor only, no Climate. Recycling plant: no malus, no emissions, consumes power, shed on shortage like any economic building.
- Odor: separate, larger Odor radius around each Mound; never added up, a Home bears the worst Mound around it. Collection reach is a distinct, smaller square.
- Road link: every facility needs a Road. A Mound works if it or an adjacent Mound touches a Road, or if their group touches a Pedestrian path network that reaches a Road. Incinerator and Recycling plant need their own Road and are not served through a Pedestrian way.
- Waste coverage needs a road link for all Homes. Pedestrian-only Homes are joined if their Pedestrian path network touches a Road linked to the facility within the Carrying distance (own Balance value, shorter than a Walking trip) and their Waste costs twice the tariff.
- A Home that is not covered says why: out of reach, capacity full, no road link, beyond the Carrying distance.
- A city already above 1000 Citizens gets an Adaptation period when the feature arrives. No separate save bump is needed beyond the new buildings.
- UI scope: Vital factor, coverage map, odor circle at placement, one stats line (produced / processed / cost), a dynamic Codex page detailing every calculation, and a Waste section in the City management page detailing the city's situation. No dedicated screen.
- Garbage trucks (a new Service vehicle) leave the Incinerator and Recycling plant; none for Mounds. They share the existing Service vehicle cap.
- Models: logic first with placeholder boxes, then art one building at a time (3 Mound Tiers, Incinerator, Recycling plant), committed on request.
- Not in scope: Waste from shops and factories, filling landfills, a collection-point building for pedestrian districts.
