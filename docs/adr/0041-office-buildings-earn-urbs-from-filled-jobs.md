---
status: accepted
---

# Office buildings earn Urbs from filled Jobs

An Office building is a workplace that produces only Urbs, in proportion to the Jobs its Commuters fill, collected by hand like Tax. Three choices are hard to reverse and look odd without context.

**Income follows filled Jobs, not the Tier.** An Office's rate is `urbsPerJobPerHour` times the Jobs actually filled, so an Office cut off from Homes earns nothing and the player is rewarded for connecting it. A flat per-Tier income was rejected: it would make the Commute irrelevant to the Office and give Jobs no gameplay value. This makes the filled Jobs of each workplace a first-class output of the Commute (`jobsLeft` stops being local to the congestion pass), computed from every mode that fills a Job: car, walking, cycling and Riders.

**A second income, not a replacement for Tax.** A Citizen who fills an Office Job still pays Tax in their Home. Employment is rewarded rather than traded against residence, and nothing couples Offices to Tax, Well-being, Needs or Sanction. Unemployment stays a statistic.

**Not a Production building.** An Office has no Slots, no Materials and no Goods, so it does not enter the Industry weight or the economic activity. Giving it a Production building's queue to unify the families was rejected: it would carry empty Slot machinery into a building that only accrues Urbs.

Rates, cap (8 hours, same at every Tier), Jobs per Tier, price and Build limit thresholds are data, not code (ADR-0021). Filled Jobs are also shown on every workplace, not only Offices.
