## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the root. See `docs/agents/domain.md`.

## Browser tests

Add `?bypass-tutorial` to the game URL in end-to-end and Playwright tests (`page.goto('/?bypass-tutorial')`) and when driving the game by hand: a new game then starts without the tutorial banner. It works in dev and in the production build, and a loaded save keeps its own tutorial state.

Also add `keep-local` (`page.goto('/?bypass-tutorial&keep-local')`): when the local city and the Cloud save have diverged, the local city wins silently instead of opening the Save conflict dialog.

And `local-auth` (`page.goto('/?bypass-tutorial&local-auth=name@example.com')`): in dev against a local Supabase only (ignored otherwise), it signs in without an email code, creating the account if needed, and gives it a Handle slugged from the email (`name-example-com`). It needs `GOTRUE_MAILER_AUTOCONFIRM=true` in the local `docker-compose.yml`.
