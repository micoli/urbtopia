# Service vehicles on the BRT network

Status: ready-for-agent
Blocked by: 01

## What to build

Ambulances, fire trucks and police cars leave a BRT-connected facility along the BRT corridor to covered Homes (scene). See [spec](../spec.md).

## Acceptance criteria

- [ ] `serviceTrip.ts` plans a trip on the network connecting the facility to a covered Home: road graph for road fronts, BRT tiles and exits (`state.brtRoads`) for BRT fronts; a facility touching both can use either
- [ ] No switching between networks; a covered Home unreachable on the facility's network gets no vehicle
- [ ] Service vehicles ignore BRT vehicles visually on the corridor; no gameplay effect, not saved
- [ ] Unit tests: trip on the BRT network, no trip across networks (prior art: `TransitLayer.test.ts`, service trip tests)
- [ ] Checked by eye in the dev server

## Comments
