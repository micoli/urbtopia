---
status: accepted
---

# Homes with no Road count their Unemployed

Amends [ADR 0059](0059-every-citizen-looks-for-a-job-and-picks-the-mode-by-travel-time.md), which did not count Unemployed Citizens in a Home reached only by a BRT corridor or Pedestrian ways.

**The reason is gone.** ADR 0059 spared those Homes because Unemployed was a statistic and 13 such Homes showed 1,000 Unemployed in a city with more Jobs than Citizens: the figure told the layout of a few streets. [ADR 0062](0062-unemployment-lowers-well-being.md) makes Unemployed lower Well-being. A city whose Homes have no Job to reach is then a problem the player must see and can fix, and a Citizen of such a Home can walk, cycle or ride to a Job like any other.

**The rule.** The Citizens of a Home with no Road who find no Job are Unemployed: they count in the total, in the Jobs Layer and in the Well-being malus. A BRT-only Home served by a line that reaches no workplace has all its Citizens Unemployed.

**What does not change.** A Home cut off from every workplace (no Job reachable by any mode, or a BRT-only Home no line serves) is still not counted Unemployed. It is already marked cut off and takes the maximum Congestion malus; counting it again would punish it twice. The Jobs section shows its Citizens apart, as "without a job, not counted".

## Consequences

- Cities with BRT-only or Pedestrian-way districts may lose Well-being where their Citizens lack Jobs. Balancing may be needed.
- The tolerance of 5% of ADR 0062 still spares a Home with a few Unemployed.
