# 08: Show Unemployed and Jobs honestly

Status: done
Blocked by: 04

**What to build:** The Traffic section, the Advisor summary, the congestion diagnosis and the workplace panel tell the truth about Jobs under the new rule.

- [ ] Traffic section: Jobs, filled Jobs and Unemployed, with Unemployed worded as a statistic.
- [ ] `buildAdvisorSummary` and the diagnosis read the new figures; Unemployed above 0 is mentioned without advice to build anything.
- [ ] The workplace panel keeps "Jobs filled: X / Y" and says by which modes when the figure is below Y.
- [ ] English and French texts; Storybook stories updated.

## Comments

- Traffic section shows Jobs, filled Jobs and Unemployed with an explanatory line; the workplace panel adds how the Jobs are reached (`jobModes`). Advisor and diagnosis read the same figures. Not added: Storybook stories for the new list.
