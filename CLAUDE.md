## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.

## Browser tests

Add `?e2e` to the game URL in end-to-end and Playwright tests (`page.goto('/?e2e')`) and when driving the game by hand. It turns on, in one parameter: `bypass-tutorial` (a new game starts without the tutorial banner; a loaded save keeps its own tutorial state), `keep-local` (when the local city and the Cloud save have diverged, the local city wins silently instead of opening the Save conflict dialog), no annual event notice banner (it depends on the date), and no export reminder banner. It works in dev and in the production build.

`bypass-tutorial` and `keep-local` also exist alone (`page.goto('/?bypass-tutorial&keep-local')`) when a test needs the annual event or export banners.

And `local-auth` (`page.goto('/?e2e&local-auth=name@example.com')`): in dev against a local Supabase only (ignored otherwise), it signs in without an email code, creating the account if needed, and gives it a Handle slugged from the email (`name-example-com`). It needs `GOTRUE_MAILER_AUTOCONFIRM=true` in the local `docker-compose.yml`.

The map also follows a Day cycle (2 real hours, see `CONTEXT.md`). `?e2e` turns on Always day, which lights the map as Daytime at all times; `page.goto('/?always-day')` does it alone. `page.goto('/?e2e&time=23:00')` pins the light to a Cycle hour (it wins over Always day) for tests of the Night. `time` only changes the light, not power or the HUD.

## UI

Decisions in `docs/adr/0051-ui-layers-tokens-variants-radix-and-icons.md`.

- Colours, radii and font sizes come from `src/tokens.css`; `build/cssTokens.test.ts` fails on literals in the game CSS.
- Every game CSS file goes in `@layer legacy` (import it with `layer(legacy)` in `src/styles.css`); Tailwind utilities sit above it.
- A shared component gets its variants with `cva`, as `ActionButton` does. Never restyle it from another context (`.banner .action-button`): add a prop.
- Icons are `<Icon name="…" />` from `src/ui/common/Icon.tsx`; add the name to `iconRegistry.ts`. No emoji as an icon.
- Dialogs use `Dialog` and tabs use `Tabs` (both Radix). Motion uses the `--duration-*` and `--ease-out` tokens and must stop under `prefers-reduced-motion`.

