# 03 Effect curve, Well-being bonus and Tax

Status: resolved
Blocked by: 02

Red first: `knowledgeEffect(cityKnowledge, max)` is 0 at 0 and null, `max` at 100, 70% of `max` at 50, monotonic. Then:
- `homeBenefits` Well-being rises by up to 8 points with city Knowledge, still capped at 100, shown in its breakdown;
- Tax per Home rises up to 5% (check `wellbeingTaxFactor` callers so the Well-being path is not double-counted);
- no Citizens -> no change.
Existing wellbeing/tax tests must stay green.

## Answer

Done, see the commit of this ticket in the history (`git log --grep` on its title).
