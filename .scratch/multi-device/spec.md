# Multi-device play

Status: ready-for-agent

## Problem

A player who owns several devices meets Save conflicts against their own save, and nothing makes handing a City from one device to another feel safe.

## Decisions

Vocabulary (Active device, Takeover, Cloud save, Save conflict, Player account) in `CONTEXT.md`. Architecture in [ADR 0095](../../docs/adr/0095-cloud-is-the-shared-truth-and-one-active-device-per-city.md).

- The Cloud save is the shared truth online; the local save is the cache for offline play.
- One Active device per City, by a server lease (2 min, renewed every 30 s). A Takeover is always possible and keeps the loser's unpushed work as a previous version.
- Offline play is free; on reconnection three cases (nobody advanced, another device advanced, equal).
- Push 30 s after an edit, on hidden and on page hide; check the revision on return to visible.
- Device-only Preferences (graphics quality, touch or desktop layout) stay local.
- The push carries the server time; `lastSeen` is capped at `now` when a Cloud save is adopted.
- Email is offered at 200 Citizens (12 h snooze, unchanged) and through a permanent "Play on another device" entry in the system menu.

## Already done

A local save that equals the Cloud save no longer raises a Save conflict (commit b4fc7a13).

## Tests

`FakeCloudSaveClient` simulates two devices for every ticket; one Playwright test with two browser contexts covers the Takeover end to end (`?e2e`, `local-auth`).
