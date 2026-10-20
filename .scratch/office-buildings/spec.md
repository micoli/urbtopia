# Office buildings

Status: ready-for-agent

Decisions from the grilling session. Vocabulary in `CONTEXT.md` (Office building). Rationale in ADR-0041.

## Rules
- Office building: new family, 3 Tiers, footprints 2x2 / 2x3 / 3x3, 40 / 80 / 120 Jobs, Jobs defined in building data like the Shop.
- Workplace: added to `workplaceTypes`, takes part in Commute, Traffic and Congestion. Nearest-first filling is unchanged.
- Filled Jobs per workplace = Jobs − Jobs left, exposed from the congestion pass, all modes (car, walking, cycling, Riders).
- Production: `urbsPerJobPerHour: 1` × filled Jobs, in `assets/defs/balance/economy.json` (new `office` section). Cap `capHours: 8`, same at every Tier. Computed at collection on the current filled Jobs, offline time counts within the cap.
- Collection by hand like Tax, reusing the bulk collection if it exists. Urbs of a sold Office are lost.
- Needs power and a road. No power: production 0, Jobs still offered. Shed like other consumers.
- Access: `road`, `brt`, `pedestrianWay`, `requiresRoad`. BRT-only: Jobs filled by Riders only.
- Menu section `build.offices`. Unlock 500 Citizens, base price 1500 Urbs with Escalating price, Build limit 1/2/3/5 at 500/1000/2000/4000 Citizens. Upgrades cost Urbs + Goods.
- Saved state: Urbs to collect + last collection instant per Office. No migration.
- No coupling with Tax, Well-being, Needs, Sanction, pollution.

## Implementation notes (step 1)
- Income accrues over time like Tax, not at collection: each advance adds filled Jobs × elapsed time (scaled by the city's power ratio) to `taxCitizenMs`, which an Office reuses as Jobs-milliseconds. This replaces "computed at collection" and the separate last-collection instant: no new saved field, no migration, offline catch-up is the same code path as Tax.
- The cap is the Jobs the Tier offers × `capHours`, not the filled Jobs, so a stock already earned never shrinks when staffing drops.
- A BRT-only Office covered by a BRT stop counts as fully staffed (its Jobs are filled by Riders, which the Commute does not model per workplace).
- `congestionStats(state).filledJobs` maps each workplace id to its filled Jobs, ready for the UI indicator of step 3.
- Codex image of the Office is missing until the 3D models exist (`scripts/codexImages.test.ts` fails on a stale `dist/codex`; regenerate with `npm run codex:generate` once models are in).
- `office.json` uses the Factory models as placeholders at 2x2 for every Tier; step 4 replaces them with the real footprints.

## UI
- Building panel: Jobs filled / Jobs offered, Urbs per hour, stock to collect.
- Jobs filled / Jobs offered indicator on every workplace (Workshop, Factory, Mill, Bakery, Shop, Casino, Venue, Public facility, Leisure building), not only Offices.
- Traffic section of the city management counts Offices.
- Texts EN/FR in `catalog.ts`; unlock announced in `codex/levelFacts.ts`.

## Delivery order
1. Core with tests: Jobs, filled Jobs, production, cap, collection, power.
2. Data: `office.json`, balance.
3. UI and i18n, including the filled Jobs indicator on all workplaces.
4. 3D models with `create-building-model`, one Tier at a time in Blender.
5. Registration with `add-building`.
