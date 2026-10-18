# The Back office keeps the Supabase service key in its own local storage

The Back office (`tools/back-office`) is a local single-page app that an Admin runs on their machine. It asks for the Supabase project URL and the `service_role` key on a connection screen, keeps both in its browser `localStorage` and calls Supabase directly. The key bypasses row-level security, which is what lets the Admin list Player accounts and read any account's Cloud saves.

## Why

- The Admin needs data that row-level security hides from every player: all accounts, and the `urb_saves` rows of other users. No `urb_*` function exposes them, and adding an admin role to the database would put an admin surface in the production schema for a tool that is only ever run by hand.
- Typing the URL and key in the app lets the Admin switch between the local stack and production without editing files or restarting a server.
- A client-only app needs no Node middleware, so the key never has to be written to a file that could be committed.

## Consequences

- `docs/security.md` no longer says the `service_role` key lives nowhere: it lives in the Back office's `localStorage`, on the Admin's machine only. It is still never committed and never in `dist/`; the CI check on `dist/` stays.
- The key is exposed to any script running on the Back office origin. The app therefore loads no third-party script, keeps its dependencies few, runs on a fixed port (5180) so no other local app shares its origin, and offers a button to forget the key.
- The Back office is never part of the deployed site: it has its own Vite config and `npm run back-office` script, and the root build only bundles the game.
- The game opens a Back office save through `postMessage`, in development only and only from the Back office origin. That session turns the Cloud save off, so a loaded city never reaches the Admin's own Player account.

## Alternatives rejected

- Key in an environment file read by a Node server: safer for the key, but needs a server layer and a file edit to change instance.
- Admin role and `SECURITY DEFINER` functions in the database: adds permanent admin surface to production for an occasional local need.
- Hosting the Back office on the deployed site behind a login: a leaked admin session would then be a production incident.
