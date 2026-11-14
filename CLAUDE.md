## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.

## Browser tests

Add `?e2e` to the game URL in Playwright tests (`page.goto('/?e2e')`) and when driving the game by hand. Other URL parameters (`local-auth`, `advisor-fake`, `time`, `always-day`…) and the Advisor flag: `docs/agents/browser-tests.md`.

## UI

Decisions in `docs/adr/0051-ui-layers-tokens-variants-radix-and-icons.md`.

- Colours, radii and font sizes come from `src/tokens.css`; `build/cssTokens.test.ts` fails on literals in the game CSS.
- Every game CSS file goes in `@layer legacy` (import it with `layer(legacy)` in `src/styles.css`); Tailwind utilities sit above it.
- A shared component gets its variants with `cva`, as `ActionButton` does. Never restyle it from another context (`.banner .action-button`): add a prop.
- Icons are `<Icon name="…" />` from `src/ui/common/Icon.tsx`; add the name to `iconRegistry.ts`. No emoji as an icon.
- Dialogs use `Dialog` and tabs use `Tabs` (both Radix). Motion uses the `--duration-*` and `--ease-out` tokens and must stop under `prefers-reduced-motion`.

## Release notes

A Release note lives in its GitHub release, not in the repository; the `release-note` skill writes it. Details: `docs/agents/release-notes.md`.
