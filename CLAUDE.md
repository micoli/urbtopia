## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.

## Browser tests

Add `?e2e` to the game URL in end-to-end and Playwright tests (`page.goto('/?e2e')`) and when driving the game by hand. It turns on, in one parameter: `bypass-tutorial` (a new game starts without the tutorial banner; a loaded save keeps its own tutorial state), `keep-local` (when the local city and the Cloud save have diverged, the local city wins silently instead of opening the Save conflict dialog), no annual event notice banner (it depends on the date), no export reminder banner, no sign-in prompt and no What's new window. It works in dev and in the production build.

`bypass-tutorial` and `keep-local` also exist alone (`page.goto('/?bypass-tutorial&keep-local')`) when a test needs the annual event or export banners. `?e2e&sign-in-prompt` brings the sign-in prompt back for a test of the prompt itself; its "Never" button turns off the "Suggest signing in" setting.

And `local-auth` (`page.goto('/?e2e&local-auth=name@example.com')`): in dev against a local Supabase only (ignored otherwise), it signs in without an email code, creating the account if needed, and gives it a Handle slugged from the email (`name-example-com`). It needs `GOTRUE_MAILER_AUTOCONFIRM=true` in the local `docker-compose.yml`.

The Advisor is behind the `advisor` feature flag: a Playwright test sets `localStorage['urbtopia-flags'] = {"advisor":true}` before loading. `?advisor-fake` swaps the Advisor's WebLLM engine for a scripted one (answer `Fake advisor answer.`), so a test never downloads a model; `?advisor-fake=fail` makes the download fail with out-of-memory, `?advisor-fake=unsupported` hides the setting as if WebGPU were missing.

The map also follows a Day cycle (2 real hours, see `CONTEXT.md`). `?e2e` turns on Always day, which lights the map as Daytime at all times; `page.goto('/?always-day')` does it alone. `page.goto('/?e2e&time=23:00')` pins the light to a Cycle hour (it wins over Always day) for tests of the Night. `time` only changes the light, not power or the HUD.

## UI

Decisions in `docs/adr/0051-ui-layers-tokens-variants-radix-and-icons.md`.

- Colours, radii and font sizes come from `src/tokens.css`; `build/cssTokens.test.ts` fails on literals in the game CSS.
- Every game CSS file goes in `@layer legacy` (import it with `layer(legacy)` in `src/styles.css`); Tailwind utilities sit above it.
- A shared component gets its variants with `cva`, as `ActionButton` does. Never restyle it from another context (`.banner .action-button`): add a prop.
- Icons are `<Icon name="…" />` from `src/ui/common/Icon.tsx`; add the name to `iconRegistry.ts`. No emoji as an icon.
- Dialogs use `Dialog` and tabs use `Tabs` (both Radix). Motion uses the `--duration-*` and `--ease-out` tokens and must stop under `prefers-reduced-motion`.


## Release notes

A Release note is not in the repository: it lives in the body of its GitHub release (a hidden `<!-- urbtopia-release-note ... -->` JSON block, FR and EN) and as the file `release-note.json` attached to it. The `release-note` skill writes it after the deploy and publishes it with `node scripts/publishReleaseNote.ts <tag> <note.json>`. A note leads its title and each item with an emoji and bolds the key words (`**bold**`, `*italic*` and `` `code` `` are rendered by the game and by GitHub); the script warns when it does not.

The game reads `api.github.com/repos/micoli/urbtopia/releases` (CORS open, 60 requests an hour per IP; a release file itself cannot be read from a browser) and opens a window when a release the player has not seen has a note. The window shows one note at a time with its release date and time, newest first, and Older and Newer buttons walk through the notes of the 100 latest releases. The last seen tag is in `localStorage['urbtopia-release-notes-seen']`; a browser with nothing stored starts on the latest release, and `?e2e` never calls GitHub. A Playwright test of the window routes that URL to a fake list and sets that key to an older tag, without `?e2e`. The `whatsapp-release` skill turns the notes not announced yet into a WhatsApp message.
