# 04: Unemployment lowers Well-being

Status: done
Blocked by: none

Decision in [ADR 0062](../../../docs/adr/0062-unemployment-lowers-well-being.md); it reverses point 5 of the spec ("Unemployed stays a statistic").

- [ ] A Home's Well-being drops with its share of Unemployed Citizens: none up to 5%, then linear to a cap of 20 points. Values in `assets/defs/balance/traffic.json` with their schema.
- [ ] None during an Adaptation period; none for a Home with no Road (never counted Unemployed).
- [ ] A new Need factor `employment` at the Safety level, effect Well-being only, section `eco-jobs`, with its texts.
- [ ] The Jobs section shows the malus and a Diagnosis Cause (too few Jobs, or Jobs out of reach).
- [ ] Texts in the Well-being section, the Guide and the Codex say Unemployed now has an effect.
- [ ] Tests: the malus, the tolerance, the cap, the Adaptation period, the Need factor, the Cause.
