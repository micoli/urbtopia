# Club engine

Status: ready-for-agent
Spec: ../spec.md

## What to build

Sport-agnostic Club model per ADR 0052: Squad of individual players (id, age, contract, history, injuries), budget fed by stadium Takings, yearly recruitment of 6 players, save format and migration. No sport rules yet.

## Acceptance criteria

- [ ] Pure module under `src/core`, no stadium, Tourist or Urbs flow knowledge beyond a narrow interface.
- [ ] Save round trip and migration tested.
- [ ] A Club in debt sells its best players; no bankruptcy.
