# 06 - Back office and read-only open

Status: done
Blocked by: 01

Spec: [spec.md](../spec.md)

## What

- Back office (`tools/back-office`): a Bug reports section with the list (status filter), the capture, the context, the thread, a reply field, status change (`new`/`seen`/`resolved`; opening a report marks it `seen`).
- **Open in game**: like Cloud saves, opens the game dev server with the report's City read-only and the Camera pose applied (a report message in the `from-back-office` handoff): no local save, no Cloud save, the Admin's Cities untouched.

## Done when

Back office tests for the domain functions; the read-only session writes nothing (test); checked by hand against the local stack.
