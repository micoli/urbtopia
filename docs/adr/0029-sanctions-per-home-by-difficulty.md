# Sanctions are computed per Home from the Needs pyramid, gated by a per-city Difficulty

Accepted. Reverses the "read-only" contract of the Need level (the pyramid explained Well-being and changed none of its effects).

Well-being only ever gave a bonus: `Tax × (1 + wellbeing / 500)`, at most +20 %, so a city with no water, no Safety and no Health lost almost nothing. A **Sanction** now lowers the Tax of a Home whose Citizens lack a basic Need, and the Needs pyramid becomes the single source of truth for it, rather than a second model of needs beside it.

- **Per Home, worst factor.** A Home's Sanction comes from its weakest unsatisfied factor among those its city's Difficulty makes sanctionable, not from a city-wide malus (which would punish well-served Homes) and not from a sum or product of factors (the player gets one cause to fix at a time, matching the pyramid's `bottleneck`).
- **Continuous, floored at half the Tax.** The Tax falls in proportion to the lack of satisfaction, never below 50 %, so a sanctioned city can always afford the service that corrects it. No Citizens are removed for now; a lower occupation of a Home is a later step, as it touches `citizensOf` and so Demand, Commute, Congestion and Build limits.
- **Only Vital and Safety sanction.** The higher Need levels keep modulating Well-being. The Well-being bonus on the Tax stays (at least 1, at most +20 %); Well-being malus no longer lowers the Tax, so a missing service is not counted twice.
- **Difficulty gates the factors.** Cozy (default, no Sanction), Easy (Safety and Health services), Medium (+ Pollution and Congestion), Hard (+ Climate, which sanctions only Homes without a Green space in reach). Severity does not vary by Difficulty yet; it will, through the same Balance table, when Citizens start leaving.
- **Difficulty lives in the save, per city,** because it changes the Tax and must replay identically on offline catch-up ([ADR 0002](0002-pure-core-injected-clock-replay-catch-up.md)). An absent field means Cozy, so existing saves keep their behaviour with no migration ([ADR 0003](0003-localstorage-versioned-save-envelope.md)). It can be changed at any time.
- **Electricity.** The Tax is already scaled by the power a Home receives, down to 0. Under Cozy this is untouched; from Easy it is replaced by the Sanction, floored at half the Tax.
- **No new warning in Cozy.** Easy and above show an alert on sanctioned Homes and a badge on the city management button, in the style of the existing power-shortage warning.

Rejected: a city-wide malus; a delay before a Sanction applies (complicates replay and `taxCitizenMs`); sanctioning every Need level with a gentler floor higher up; a global player setting outside the save (cannot replay).
