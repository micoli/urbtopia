# 04: Every Citizen looks for a Job, Walkers then Cyclists first

Status: ready-for-agent
Blocked by: 02, 03

**What to build:** The Commute assigns Jobs to all the Citizens of every Home, in three city-wide passes (Walkers, Cyclists, the rest), nearest first by Travel time, with deterministic tie-breaks. Mode choice for the third pass is still the current Rider and car split, so this ticket changes who fills the Jobs and nothing else.

- [ ] Passes run over all Homes in each step; the result does not depend on Home order (a test shuffles the Homes).
- [ ] Ties break by Home id then workplace id.
- [ ] `filledJobs` counts every mode; the special case "staffed by Riders" and the BRT-only job count are replaced by the general rule.
- [ ] `unemployed` counts Citizens with no Job within reach, with no effect on Tax, Well-being, Needs or Sanction.
- [ ] A Walker is never displaced by a Cyclist, a Rider or a driver, and a Cyclist never by a Rider or a driver (tests with scarce Jobs).
- [ ] In the ticket 01 fixture, the Hardware store and the Office are staffed; the figures that moved are listed in the Comments.

## Comments
