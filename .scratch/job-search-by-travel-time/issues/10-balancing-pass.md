# 10: Rebalance after the new Commute

Status: done
Blocked by: 06, 07

**What to build:** Play the new rule on `idealCity`, `evolvedCity` and the Robbart save, and retune what it moved.

- [ ] Rider share, Congestion index, Well-being penalty, emissions and temperature compared before and after, in a table in `.scratch/traffic-congestion/balancing.md`.
- [ ] Objectives and Sanctions that read Congestion or climate still reachable and still meaningful (listed with the values chosen).
- [ ] Lane capacities, Road tier speeds and line capacities retuned as data, never as code.
- [ ] Time on `transportStats` and `congestionStats` on a 1,000-Citizen and a 5,000-Citizen city.

## Comments

- Done: the car speeds went from 2 / 2.5 / 3 to 1.5 / 2 / 2.5 tiles per minute (`assets/defs/balance/traffic.json`) so that a bus beats a car on a long trip over a tier 1 road. Measurements, the before and after of the three cities and the synthetic table are in `.scratch/traffic-congestion/balancing.md`.
- The earlier finding that public transport carries nobody was an artefact: `idealCity` and `evolvedCity` have no line, and Robbart's jobs are all within cycling range.
- Not measured: BRT (fixture inactive), Metro, large cities with several lines. No value of the Well-being penalty, objectives or Sanctions was changed.