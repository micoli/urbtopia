# Baseball management page

Status: resolved
Spec: ../spec.md
Blocked by: 12, 13

## What to build

Management page for the baseball field: Squad, batting order, starting pitcher, innings feed with pitcher change, Championship table, reusing the football page components.

## Acceptance criteria

- [x] Reuses shared pieces; FR and EN.
- [x] Playwright test: set a lineup, play a Match.

## Comments

Shared with the football page: the dialog, the summary, the Squad, Recruitment and Championship tabs, the player row, the match clock and buttons (`useLiveMatch`, `ClubMatchBar`). Specific to baseball: the lineup tab, the match tab with its controls and its feed.
