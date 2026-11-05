---
status: accepted
---

# Every Citizen looks for a Job and picks the mode by travel time

Amends [ADR 0011](0011-congestion-as-core-model-with-visual-vehicles.md) and makes [ADR 0041](0041-office-buildings-earn-urbs-from-filled-jobs.md) true as written. It also retires the Modal shift step and the fixed 70% Rider share.

**The trigger.** In a city of 1,000 Citizens with 951 Jobs, 700 Citizens rode the Metro and filled none of them: only the 300 who walked or cycled counted, so 651 Jobs stayed unfilled, a Hardware store had nobody, an Office earned nothing, and Unemployed read 0. ADR 0011 built the Commute to measure road load, so it left out everyone who does not drive; the Job limit was added to the same loop afterwards, and ADR 0041 said Riders fill Jobs without the code doing it, except for a workplace reached by BRT only.

**Every Citizen of a Home looks for a Job.** The mode no longer decides who works. A Citizen who finds no Job within reach is Unemployed. Unemployment stays a statistic, as ADR 0041 decided: no effect on Tax, Well-being, Needs, Sanction or Urbs.

**Homes with no Road are not blamed.** A Home reached only by a BRT corridor or by Pedestrian ways has no way to drive, and may be cut off from every Job whatever the city offers. Its Citizens who find no Job are not counted Unemployed, as before this decision. Measured on a city of 7,163 Citizens, counting them gave 1,000 Unemployed in 13 such Homes while Jobs outnumbered Citizens; the figure reflected the layout of a few streets, not the city.

**Priority by mode, city-wide, then nearest first.** Jobs are given in three passes over all the Homes of the city, so the result never depends on the order the Homes are visited in:

1. **Walkers**: Citizens whose workplace is within walking distance on the Pedestrian path network take it first.
2. **Cyclists**: then those within cycling distance. To a Job it is twice the walking distance (20 tiles at the usual threshold), narrower than the three times of ADR 0038 that still apply to Services and to the way to a station: with three times, Citizens of compact cities cycled to every Job and the lines carried nobody (Maenia, 30 Riders; TheQueen, 903).
3. **Everyone else** picks between public transport and the car, whichever has the shorter travel time.

Inside a pass, the shortest travel time is served first; ties break by Home id, then workplace id. A Walker is never displaced by a Rider or a driver, and a Cyclist is never displaced by a Rider or a driver.

**The mode is chosen by travel time, not by distance.** Distance ignores the wait for a vehicle, the Transfers and the walk to a stop, which are what make a Metro line beat a straight road or lose to it. For a Home and a workplace:

- **By car**: the length of the shortest road path divided by the speed of each Road section, which Congestion slows. The speeds come from a first pass at free-flow speed and a second pass with the speeds the first pass produced, the way the effective speed of buses already works (ADR 0011), so the calculation stays bounded and deterministic. A feedback loop iterated to a fixed point was rejected for the same reason.
- **By public transport**: the minutes of the best Transit itinerary, as today: walk to the stop, wait of half a headway, ride, Transfers, walk from the last stop.
- The shorter one wins; a tie goes to public transport, which loads no road. If the line has no spare capacity left, the Citizen drives. If the Home has no road access, or the workplace no Road, the other mode is the only one.

**Riders reach every workplace.** The Transit itineraries lead to every kind of workplace (Offices, Public facilities, Leisure buildings and Venues included), not only to Workshops, Factories and Shops. The Riders keep making their Service trips by public transport as before.

**The fixed share of Riders disappears.** The 70% eligibility and the 90% ceiling of the Modal shift were two constants standing in for a choice the model could not make. The share of Riders is now an output, limited by the spare capacity of the lines. The Modal shift step is removed: a Road that saturates slows the car, so more Citizens find public transport faster, which is what the step approximated.

**Saved cities** get an Adaptation period: their mix of modes can change a lot, and the Well-being effects of Congestion are not charged while the city reorganises.

## Considered options

- **Give Riders only the Jobs left over (patch).** One extra pass after the Commute. It would have fixed the symptom for a few days of work but left the 70% constant, the missing Unemployed and a model in which Riders never compete for a Job. Rejected: the user chose to model the choice.
- **Priority per Home.** Simpler, but the first Home visited takes the best Jobs, so a layout would change a result through Home ids alone. Rejected.
- **Distance as the criterion.** Rejected for the reason above.
- **Individual Citizen journeys.** Still rejected, as in ADR 0005 and ADR 0011: the model stays aggregate per Home.

## Consequences

- The Rider share, Congestion, emissions and temperature, and the objectives that read them all move. The tunable values are in `.scratch/traffic-congestion/balancing.md`, to be revisited by the balancing ticket of `.scratch/job-search-by-travel-time`.
- ADR 0011 said Riders have no destination in the model: that no longer holds.
- Unemployed can now be above zero. Because workplaces rarely outnumber Citizens by much, a city with fewer Jobs than Citizens shows the difference.
- A workplace reached by BRT only is no longer a special case: its Jobs are filled by whoever reaches it fastest.
