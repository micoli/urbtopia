# 10: Rebalance after the new Commute

Status: ready-for-human
Blocked by: 06, 07

**What to build:** Play the new rule on `idealCity`, `evolvedCity` and the Robbart save, and retune what it moved.

- [ ] Rider share, Congestion index, Well-being penalty, emissions and temperature compared before and after, in a table in `.scratch/traffic-congestion/balancing.md`.
- [ ] Objectives and Sanctions that read Congestion or climate still reachable and still meaningful (listed with the values chosen).
- [ ] Lane capacities, Road tier speeds and line capacities retuned as data, never as code.
- [ ] Time on `transportStats` and `congestionStats` on a 1,000-Citizen and a 5,000-Citizen city.

## Comments

- Measurements and findings are in `.scratch/traffic-congestion/balancing.md`. The retuning is not done and needs play: public transport carries nobody in the three sample cities (walking and cycling take every Job first, and a car beats a bus or a Metro under about 15 tiles). Levers listed there.
