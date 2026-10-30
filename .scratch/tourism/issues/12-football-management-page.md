# Football management page

Status: resolved
Spec: ../spec.md
Blocked by: 10, 11

## What to build

Dedicated page opened from the stadium panel: Squad, lineup, formation, recruitment, Match feed with tactic and substitution controls, Championship table.

## Acceptance criteria

- [x] Built on shared components and tokens; FR and EN.
- [x] Playwright test: set a lineup, play a Match.
- [x] Guide and Codex entries.

## Comments

Decisions made during a Match are recorded with `PlayMatch` and replayed by the simulation at settlement. The lineup at settlement should be the one watched: changing it after recording changes the replay. The Codex was not touched (generated from the building definitions); a Clubs guide article (EN, FR) covers the rules.
