# Bug reports

Status: needs-triage

## Problem

A player who meets a defect has no way to tell us, and we cannot see what they saw. A **Bug report** sent from the game, with a capture, a copy of the City and the Camera pose, lets the Admin reproduce the problem and answer.

Decisions are in [ADR 0058](../../docs/adr/0058-bug-reports-keep-attachments-in-the-database.md); the terms **Bug report**, **Report attachment**, **Report reply** and **Camera pose** are in `CONTEXT.md`.

## Decisions

### Who and where

- Only a Player account with an attached email can report. An anonymous account sees the entry point, which invites it to attach an email.
- Beta only: every bug report feature (entry, shortcut, Reports tab, unread polling) exists only once the Player has joined the beta in the settings; leaving the beta hides them.
- Entry points: a "Report a bug" section in the Game tab of the settings, between City and Difficulty, and a keyboard shortcut (Alt+Shift+B). No permanent HUD button.
- At most five Bug reports a day per Player account. Replies do not count.

### The form

- Opening the form freezes everything that will be sent: the captures, the copy of the City (with its id and Seed), the Camera pose and the technical context. The game keeps running behind the form (the clock catches up on real time, so a pause would need a new engine mechanism): nothing needs one, since everything sent is already frozen at opening. Changing City while typing changes nothing of what is sent.
- The captures are taken **before** the dialog opens, or it would hide the map: the map alone (WebGL canvas) and the whole screen (canvas composed with the rendered DOM, e.g. `html-to-image`). If the DOM rendering fails, only the map alone is offered; the send is never blocked.
- The player chooses the image: map alone, whole screen, or none, with a preview. A warning next to the whole screen says it can show other players' Handles and messages.
- "Attach my City" is checked by default and can be unchecked. The description is the only required field.
- Technical context: game version, user agent, screen size, GPU, recent console errors, Seed, City id.
- If the City, gzipped, is above 2 MB, "Attach my City" is disabled with a message and the report goes without it.
- A failed send (offline, server error) keeps the form open with an error and a "Retry" button. Nothing is queued; the typed text is kept until the page reloads.

### Storage

- Supabase tables: `urb_bug_reports` (author, description, status, Camera pose, context, City id and Seed, read flags) and `urb_bug_report_attachments` (capture, City) so lists never load blobs. Replies in `urb_bug_report_replies`.
- Capture: resized to about 1,280 px, WebP or JPEG at quality about 0.7, stored as base64 text, with a size check. City: `jsonb`; above 1 MB it is gzipped (`CompressionStream`) and stored as base64 text, capped at 2 MB compressed.
- Row level security: an author reads and writes only their own report and replies; the Back office uses the service key. The daily limit is enforced in the database, like `urb_message_daily_cap`.
- Retention: 90 days after creation, or 30 days after `resolved`, whichever comes first, and with the Player account (cascade). The player cannot delete a report.

### Follow-up

- Statuses: `new`, `seen`, `resolved`. "New message" for the player is a read flag, not a status.
- Replies: text only, 500 characters, from the player or the Admin, open until `resolved`, closed after. The player reads them in the Reports tab of the settings, with a badge on the tab when one is unread. No email is sent; the Admin may write to the attached email by hand.
- The Back office lists reports with their status, shows the capture, replies, changes the status and opens the City in the game.
- Opening: like a Cloud save, the Back office opens the game dev server (`?bypass-tutorial&from-back-office`) and posts the City and the Camera pose to it. The game loads the City **read-only** (no autosave, no Cloud save, nothing written), applies the Camera pose and shows a banner. A message is accepted only from the Back office origins, in a development build. The Admin's own save is not replaced.

## Facts to check

- The WebGL renderer has no `preserveDrawingBuffer`: the map capture must render then read the canvas in the same frame.
- `CameraController` (`src/scene/CameraController.ts`) holds the pose; it needs a read and a write of position, zoom, rotation and Level.
- Reuse `exportEnvelope` (`src/persistence/transfer`) for the copy of the City.

## Out of scope

Reports from anonymous accounts; an offline queue; GitHub, email or Storage bucket delivery; deleting a report by the player; attachments in replies; categories or suggestions (bugs only); email notifications; screen sharing (`getDisplayMedia`).

## Tests

- Unit: size and gzip rules, daily limit, retention, frozen payload.
- E2E (`?e2e&local-auth=…`): report with each image choice, City too large, failed send then retry, Admin reply read in the game, closed thread after `resolved`.
- Database: row level security (author sees only their own), daily limit, cascade with the account.
- Read-only opening of a report: no write to local save or Cloud save.
