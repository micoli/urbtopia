# Ecological city delivery validation

Date: 2026-10-03
Completion: all 20 implementation tickets completed following autonomous triage.

## Automated evidence

- TypeScript typecheck, ESLint and production Vite build pass.
- Full Vitest suite: 53 files, 486 passing tests.
- Asset extraction and registry consistency checks pass; evolved reference save regenerated.
- Energy tests cover self-consumption before sharing, distance limits, overlapping sources, residual-source charging, storage capacity and conservation, insufficient funds, adaptation, insulation, bounded green benefits and bus coverage without duplicate riders.
- Catch-up tests compare six-hour advancement with partitioned ticks, including generation cycles, batteries and paid-service exhaustion. The existing 48-hour offline limit remains covered.
- Save fixtures cover versions 1–4, migration and persisted equipment, stored energy, bus lines and time offsets. Legacy electricity placement assertions now allow shortages; water constraints remain enforced.
- Regression checks cover negative initial animation deltas and budget/storage boundary rounding. Dashboard rendering checks cover FR/EN and accessible management entry points.

## Browser evidence

Local Vite browser session with a dedicated validation city containing solar Homes, insulation, wind, standalone solar, battery, backup, parks, trees and signed stops.

- Desktop HUD layouts A/B/C open the management dialog; focus enters it, Escape closes it and restores the opening control.
- A 390×844 touch viewport renders the city and scrolling management dialog without horizontal document overflow. This is device emulation, not physical-device testing.
- FR/EN labels and explanatory sections render. Solar roofs, trees, BUS placards and moving buses are visible.
- Creating an overlapping line preserves deduplicated riders; editing line #30 reverses stop order to 14 → 13 without adding another line. Clearing the edit selection retains the existing line identity.
- No browser console errors observed. A 48-hour catch-up in this small reference city took approximately 5.7 ms; this is a local observation, not a large-city performance guarantee.

## Balancing and practical limits

The initial balancing table remains provisional. Insulation reduces Home demand by 30%; green Tax benefit is bounded at 10%, and connected greenery gains a capped 20% weight bonus. Parks improve local indicators without subtracting emissions. Solar production stops at night; backup remains available after adaptation but consumes Urbs and adds emissions. Overlapping bus lines cannot create additional riders, and an empty connected line still costs Urbs. Paid services stop at zero funds. These reference outcomes support coherent tradeoffs; extended player playtesting is still needed for economy tuning.

Parks compose existing CC0 trees. Batteries use an explicitly identified container base; backup uses an industrial model. Buses and BUS placards are procedural scene elements. These substitutions are documented in balancing.md and are delivered, not missing assets.

Domain documentation is updated in CONTEXT.md and ADR 0005. Earlier global-energy and decorative-traffic specifications retain history with superseding notes. All stage gates are validated together against the final integrated build; no intermediate stage was separately published.
