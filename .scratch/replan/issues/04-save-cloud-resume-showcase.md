# Save the Replan, resume it, keep the Showcase

Status: ready-for-agent
Blocked by: 01

- The save envelope gains an optional Stash and an optional starting layout; a save without them loads as before, no migration (ADR 0003).
- The Cloud save carries them; two devices of one Player account meet a Replan in progress through the usual Save conflict (ADR 0015, 0047).
- A reload resumes the Replan with the same Stash.
- The Showcase is not replaced while a Replan is active; it is replaced when it ends.
- Done when: round-trip tests of an envelope with a Replan, an old save without one, and a test that the Showcase upload is skipped during a Replan; `tsc`, lint and tests pass.
