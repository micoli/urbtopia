# Back office

Local tool to list Player accounts, moderate them and inspect their Cloud saves. Never deployed: the root build only bundles the game. See ADR 0037.

```
npm run back-office     # http://localhost:5180 (fixed port)
npm run dev             # the game, to open a save in it
```

Each Supabase project is a profile: a name, a color, its URL, its `service_role` key and the game URL. Add the first one on launch, then add, edit, remove or switch from the profile menu in the top bar; the top bar takes the profile's color. Profiles stay in this browser's local storage, removing one erases its key. For the local stack, the key is the public demo `service_role` key of `docker-compose.yml`.

- Accounts: search, filter, ban/unban, edit or reset the Handle (each asks to type the Handle to confirm).
- Cloud saves: the 10 revisions with stats, JSON download, and **Open in game**, which opens the game dev server with `?bypass-tutorial&from-back-office` and posts the save to it. The game opens it read-only: the local save and the Cloud save are left untouched.
- Bug reports: the reports of players with an attached email, filtered by status (`new`, `seen`, `resolved`). Opening one marks it `seen`; it shows the description, capture, Camera pose, technical context and the thread. The Admin can reply (500 characters) until the report is `resolved`, change its status, and **Open in game**: the City of the report loads read-only in the game (nothing is saved) with the Camera pose applied.
- Stats: one row per account, one column per Preference found in the latest Cloud save of the accounts, read from the `prefs` of the stored save itself (unknown keys and values included, never the preferences the game knows today). A dash means the save does not have that key. Sorted by date of the save, newest first; click a column header, the date included, to sort by it, click a user to open the account.
- Stats and Dashboard share a period selector above them: all time, the last 7 or 14 days, a day, or a date range, the last 7 days being the default so the figures are those of the active users. It applies to the date of the latest save of each user, before the saves are read, so a user whose latest save is outside the period is left out.
- Dashboard: figures drawn from the latest Cloud save of each account, never from the earlier ones. Accounts and recency, cities per user, citizens, Urbs, buildings and parcels (50th, 75th, 90th and 95th percentiles), Tutorial step, Difficulty, politics, Challenge, save format version, save readability and size, the distribution of the values of every preference found in the saves, language by difficulty, and the content of the cities: the most built buildings, the kinds of buildings, transport, farming, market, trade and donations, and the buildings no city has built. The content reads the latest save of each City made in the period (the users' figures read the latest save of each user), so it loads up to three saves per user. Each indicator has a chart that fits its data: a meter for one ratio, a donut for a few parts, columns for a scale, ranked bars for a long list, and a nested bar of the 50th, 75th, 90th and 95th percentiles for the size of the cities. It reads the full saves, ten users at a time, so it takes a moment on a large project.
