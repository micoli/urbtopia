# Riders, Jobs and Shop sales for BRT-only buildings

Status: resolved
Blocked by: 03

## What to build

BRT-only workplaces are staffed by Riders of covered Homes and a BRT-only Shop sells to covered Citizens (core). See [spec](../spec.md).

## Acceptance criteria

- [x] Jobs of a BRT-only Shop, Leisure building or Public facility are filled only by Riders of Homes covered by a station
- [x] A BRT-only Shop sells to Citizens covered by a station
- [x] A BRT-only Public facility keeps its radius coverage
- [x] Modal shift stays bounded by the spare capacity of the serving lines
- [x] Unit tests: Jobs filled by Riders only, sales to covered Citizens, coverage unchanged (prior art: `modalShift.test.ts`, `jobs.ts` tests)

## Comments
