# Stand still during a Replan, with no Catch-up

Status: ready-for-agent
Blocked by: 01, 04

- Economy, Citizens, production, politics and Day cycle do not advance while a Replan is active.
- At Finish or Cancel the time spent is skipped: no Catch-up and no summary for it. A City closed during a Replan reopens still in it.
- Done when: tests that the game clock and the economy do not move during a Replan, including across a reload and a long absence; `tsc`, lint and tests pass.
