# Emergency vehicles follow traffic (option)

Status: ready-for-agent
Blocked by: 04

## What to build

A configuration constant subjects ambulances, fire trucks and police cars to the same car-following engine as buses.

## Acceptance criteria

- [ ] SERVICE_VEHICLES_FOLLOW_TRAFFIC, off by default, not exposed in Settings
- [ ] Off: behaviour unchanged, priority kept
- [ ] On: same engine as buses, no priority, same route to covered Homes
- [ ] Unit tests for both modes

## Comments
