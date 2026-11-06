# 04 - Report form and send

Status: done
Blocked by: 02, 03

Spec: [spec.md](../spec.md)

## What

- "Report a bug" in the settings and a keyboard shortcut. An anonymous account sees an invitation to attach an email instead of the form.
- Opening takes the snapshot first (ticket 03), closes the windows around the map and opens a `Dialog`: description (required), image choice (map alone / whole screen / none) with preview and the Handles warning, "Attach my City" (disabled above 2 MB), a list of what will be sent.
- Send with Retry on failure; typed text kept until reload; the daily-limit error is shown.
- i18n FR/EN, one React component per file, tokens and `Icon` per ADR 0051.

## Done when

Component tests with the fake client; the form works against a local Supabase in the browser.
