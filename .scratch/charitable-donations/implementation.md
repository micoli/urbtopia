# Solidarity implementation

Status: implemented

## Delivered

- Goods can be donated from the Market with quantity selection and a preview of stock, fixed value, time gained, overflow, and Medal progression.
- Each city has a reserve capped at 24 hours. It gives a fixed +5 Well-being and expires at the correct economic boundary during normal play, offline catch-up, and Time skips.
- New reserve duration costs `max(200, 2 * Citizens)` of Donation value per 24 hours. Existing duration is never repriced.
- Solidarity is shown as an optional Belonging bonus; it is excluded from the required-factor average and bottleneck.
- A local outbox retains pending donations across reloads and city resets. Authenticated account receipts use unique Donation ids to avoid counting retries twice. Guest donations attach to the first email account used to synchronize them.
- The account's Ville solidaire Medal evolves at 1,000 / 10,000 / 100,000 cumulative value. The social profile displays progression and Friends receive the current distinction through existing social snapshots.
- A dedicated in-game Codex page explains the rules in French and English and is accessible from the Market, Needs pyramid, and Codex navigation.

## Tickets

1. [Core and city reserve](issues/01-solidarity-reserve.md) — resolved.
2. [Market interface](issues/02-market-donations.md) — resolved.
3. [Account progression and Medal](issues/03-account-medal.md) — resolved.
4. [Needs and Codex](issues/04-needs-and-codex.md) — resolved.
5. [Integration](issues/05-integration.md) — resolved.

## Validation

- `npm run typecheck` — passed.
- `npm run build` — passed, including TypeScript and production bundling.
- ESLint on changed source files and the new browser scenario — passed.
- 117 focused unit tests across the donation core, fake account client, Needs pyramid, profile, localization, Challenge snapshot parsing, sanctions balance, and ecological replay — passed.
- 35 focused SQL assertions across Solidarity, client privileges, and Friend Medals — passed.
- Two Playwright scenarios (desktop and mobile) — passed. They cover donation previews, overflow, persistence of pending progress across a city reset and reload, and the dedicated Codex page. Screenshots were reviewed.
- `git diff --check` — passed.

## Database and rollout

Migration `supabase/migrations/20261019000001_urb_solidarity.sql` was applied to the local Docker development database. Database TypeScript types were regenerated. Production deployment must include this migration before the new account synchronization RPC is used; no production deployment was performed in this session.

Donation values follow the game's existing client-trust approach for voluntary contribution declarations. The server enforces authenticated ownership, receipt immutability and deduplication; it does not independently verify city stock.

## Existing full-suite SQL issue

The full SQL run found 60 pre-existing Daily challenges in the local development database while `urb_challenges.test.sql` assumes a clean set of 12. Its helper can select an expired Daily challenge, causing `urb_challenge_unavailable`. No existing player or challenge data was removed to satisfy that test. The new privilege allowlist was updated, and the focused Solidarity, privileges and Friend Medal suites all pass.
