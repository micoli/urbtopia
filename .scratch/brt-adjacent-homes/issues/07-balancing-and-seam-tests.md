# Balancing and cross-seam checks for BRT districts

Status: ready-for-agent
Blocked by: 01, 02, 03, 04, 05, 06

## What to build

Measure that a BRT-only district can thrive and that existing cities are unchanged. See [spec](../spec.md) and [bus-in-traffic balancing](../../bus-in-traffic/balancing.md) for the format.

## Acceptance criteria

- [ ] Headless autoplayer city with and without a BRT-only district: values recorded in `.scratch/brt-adjacent-homes/balancing.md`
- [ ] Existing and autoplayer cities without BRT-only buildings show no change in Congestion, Well-being or Tax
- [ ] Old saves load unchanged (no migration of the versioned envelope)
- [ ] If a BRT-only district cannot sustain itself, record tuning proposals (station coverage, BRT capacity, Jobs) instead of changing rules
- [ ] Full test suite, lint and build pass

## Comments
