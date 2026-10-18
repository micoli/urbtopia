# Back office

Local tool to list Player accounts, moderate them and inspect their Cloud saves. Never deployed: the root build only bundles the game. See ADR 0037.

```
npm run back-office     # http://localhost:5180 (fixed port)
npm run dev             # the game, to open a save in it
```

Each Supabase project is a profile: a name, a color, its URL, its `service_role` key and the game URL. Add the first one on launch, then add, edit, remove or switch from the profile menu in the top bar; the top bar takes the profile's color. Profiles stay in this browser's local storage, removing one erases its key. For the local stack, the key is the public demo `service_role` key of `docker-compose.yml`.

- Accounts: search, filter, ban/unban, edit or reset the Handle (each asks to type the Handle to confirm).
- Cloud saves: the 10 revisions with stats, JSON download, and **Open in game**, which opens the game dev server with `?bypass-tutorial&from-back-office` and posts the save to it. The game backs up the local city first and turns the Cloud save off for that session.
