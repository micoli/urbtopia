# Emergency vehicles follow traffic (option)

Status: resolved
Blocked by: 04

## What to build

A configuration constant subjects ambulances, fire trucks and police cars to the same car-following engine as buses.

## Acceptance criteria

- [x] SERVICE_VEHICLES_FOLLOW_TRAFFIC, off by default, not exposed in Settings
- [x] Off: behaviour unchanged, priority kept
- [x] On: same engine as buses, no priority, same route to covered Homes
- [x] Unit tests for both modes

## Comments

## Answer

`src/scene/trafficOptions.ts`: `TRAFFIC_OPTIONS.SERVICE_VEHICLES_FOLLOW_TRAFFIC` (false). `vehicleTraffic.allowedTravel` factors the gap, stop-tile and node rules out of `advanceTrafficVehicle`. `serviceDrive.ts` (`startServiceTrip`, `driveServiceTrip`) drives a service trip either as before or, when the option is on, through `allowedTravel` with lane choice; `ServiceVehicleLayer` uses it and exposes its vehicles so `TrafficLayer` treats them as obstacles (`externalVehicles`). They also wait for pedestrian Crossings and give way to BRT. `GameScene` wires both layers each frame. Tests in `serviceDrive.test.ts`. Not observed in the browser (option off by default).
