# Calculate bus usage, operating costs and traffic reduction

Type: task
Status: ready-for-agent
Completion: completed
Stage: Stage 3
Blocked by: 17
Spec: [Ecological city](../spec.md)

## What to build

Reward lines that connect Homes and activity locations without individual citizen journey simulation.

## Acceptance criteria

- [x] Calculate usage from service connectivity and both residential/activity coverage rather than proximity to an isolated stop.
- [x] Deduplicate covered Citizens across overlapping stops and lines; cap usage and automobile reductions by actual need.
- [x] Charge per-line operating costs and apply the agreed insufficient-Urbs behavior without allowing negative balances.
- [x] Reduce decorative automobile Traffic consistently with authoritative usage and calculate the agreed transport emissions.
- [x] Integrate cost/usage effects with Time skip and 48-hour catch-up; verify overlapping routes, empty lines and disconnected routes.

## Implementation constraints

Follow the approved spec and ticket 01's settled rules. Keep the core pure and deterministic, derive statistics instead of saving them, and include versioned migrations with compatibility fixtures whenever persisted state changes. New UI text is translated FR/EN. Use English identifiers and minimal English comments; one React component per file.

## Comments

Triaged for autonomous implementation. Follow balancing.md; prerequisite tickets must be completed first. Initial balancing values may be adjusted against reference cities with recorded evidence.


Implementation completed. Evidence: src/core/transport.ts; advance.ts; src/scene/TrafficLayer.ts; ecology.test.ts. See [delivery validation](../validation.md) for checks and practical limits.
