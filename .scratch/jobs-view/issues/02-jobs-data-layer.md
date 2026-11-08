# 02: Jobs Data layer

Status: needs-triage
Blocked by: none

**What to build:** A Jobs Layer in the Analytics view. It projects figures the Commute already computes and adds no simulation.

- [ ] Homes are painted by the share of their Citizens that are Unemployed.
- [ ] Workplaces are painted by Fill rate.
- [ ] A legend with two gradients, in `layerLegends.ts`, and a readout on a tapped Home or workplace.
- [ ] The Layer is registered in the Layer order and its preference round-trips.
- [ ] A Home with no Road, reached only by BRT or Pedestrian ways, is never read as Unemployed (same rule as the statistic).
- [ ] Texts in the i18n catalog, FR and EN; Guide and Codex mention the Layer.
