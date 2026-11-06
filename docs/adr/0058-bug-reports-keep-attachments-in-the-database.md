---
status: accepted
---

# Bug reports keep their attachments in the database

A Player account with an attached email can send the Admin a Bug report from the game. It carries a description, the technical context, and optional Report attachments: a capture of the screen (the map alone or the whole screen, chosen by the player after a preview) and a copy of the open City, plus the Camera pose. Everything is stored in the Supabase database, in a table apart from the report itself. The Admin reads, answers and closes reports from the Back office; the player reads the answers in the game.

## Why

- No new service: the project already runs on Supabase, and the Back office already acts on its database with the service key. A bucket, a GitHub token or an Edge Function would add a part to run for a few reports a day.
- The attachments are small. The capture is resized to about 1,280 px and encoded as WebP or JPEG (about 80 to 200 KB), stored as base64 text. The City is stored as `jsonb` (our saves weigh tens of KB); above 1 MB it is gzipped on the client and stored as base64 text.
- A table apart (`urb_bug_report_attachments`) keeps the list of reports in the Back office free of blobs.
- GitHub Issues were rejected: they take no heavy attachment, and the City and capture would need hosting elsewhere anyway. A downloaded `.zip` sent by the player was rejected: too much friction, almost no report would arrive.
- Only accounts with an attached email may report: the Admin can reach them, and the daily limit and the purge have an owner to count against.

## Consequences

- The feature ships to beta members only: the Player must have joined the beta in the settings. The entry sits in the Game tab and the answers in a Reports tab, both hidden otherwise.
- Hard limits in the database: 2 MB compressed for a City (above, the report goes without it), a size check on the capture, five reports a day per Player account. Replies (500 characters, text only) do not count in that limit and close with the status `resolved`.
- A Bug report is purged 90 days after its creation, or 30 days after it is resolved, whichever comes first, and with the Player account. The player cannot delete one.
- The copy of the City and the capture are frozen when the form opens (the game is not paused: its clock follows real time, and the freeze makes a pause unnecessary): changing City during the typing changes nothing of what is sent. The report records the City id and Seed. Nothing is queued offline: a failed send is retried by hand.
- The whole-screen capture can show other players' Handles and messages, hence the preview and a warning next to the choice.
- The Admin opens the City of a report in the game read-only, with the Camera pose applied, through the Back office handoff of ADR 0037 (development builds only, messages from the Back office origins only). It touches neither the Admin's Cities nor any save.
- Storage cost and backup size grow with the number of reports; the daily limit and the purge are what bound them. If volume grows, moving the attachments to Storage is a change in one table.
