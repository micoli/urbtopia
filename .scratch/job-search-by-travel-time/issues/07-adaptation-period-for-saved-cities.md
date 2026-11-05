# 07: Adaptation period for cities saved before this rule

Status: done
Blocked by: 05

**What to build:** A city loaded from a save made before the new rule gets an Adaptation period during which the Well-being effects of Congestion are not charged, announced as for other new rules.

- [ ] A save format version marks the rule; an older save sets the Adaptation period on load, a new city does not.
- [ ] The existing notice and Sanction handling of the Adaptation period are reused, with a new line saying what changed.
- [ ] Saves tests regenerated with `npm run saves:update`; the diff is explained in the Comments.
- [ ] Vitest: an old save is adapting, then stops adapting after the period.

## Comments

- Save version 18: migration `startJobSearchAdaptation` gives a city that has Homes and workplaces a 24 hour Adaptation period; frozen fixture `save-v18.json`; `saves/` regenerated with `npm run saves:update`. Older migration tests now apply each step in isolation.
