# Browser tests

Add `?e2e` to the game URL in end-to-end and Playwright tests (`page.goto('/?e2e')`) and when driving the game by hand. It turns on, in one parameter: `bypass-tutorial` (a new game starts without the tutorial banner; a loaded save keeps its own tutorial state), `keep-local` (when the local city and the Cloud save have diverged, the local city wins silently instead of opening the Save conflict dialog), no annual event notice banner (it depends on the date), no export reminder banner, no sign-in prompt and no What's new window. It works in dev and in the production build.

`bypass-tutorial` and `keep-local` also exist alone (`page.goto('/?bypass-tutorial&keep-local')`) when a test needs the annual event or export banners. `?e2e&sign-in-prompt` brings the sign-in prompt back for a test of the prompt itself; its "Never" button turns off the "Suggest signing in" setting.

And `local-auth` (`page.goto('/?e2e&local-auth=name@example.com')`): in dev against a local Supabase only (ignored otherwise), it signs in without an email code, creating the account if needed, and gives it a Handle slugged from the email (`name-example-com`). It needs `GOTRUE_MAILER_AUTOCONFIRM=true` in the local `docker-compose.yml`.

The Advisor is behind the `advisor` feature flag: a Playwright test sets `localStorage['urbtopia-flags'] = {"advisor":true}` before loading. `?advisor-fake` swaps the Advisor's WebLLM engine for a scripted one (answer `Fake advisor answer.`), so a test never downloads a model; `?advisor-fake=fail` makes the download fail with out-of-memory, `?advisor-fake=unsupported` hides the setting as if WebGPU were missing.

The map also follows a Day cycle (2 real hours, see `CONTEXT.md`). `?e2e` turns on Always day, which lights the map as Daytime at all times; `page.goto('/?always-day')` does it alone. `page.goto('/?e2e&time=23:00')` pins the light to a Cycle hour (it wins over Always day) for tests of the Night. `time` only changes the light, not power or the HUD.
