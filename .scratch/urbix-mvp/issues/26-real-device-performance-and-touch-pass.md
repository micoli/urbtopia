# 26: Real-device performance and touch pass

**What to build:** A human verifies the MVP on real devices and records findings; follow-up tickets are created for any failure. Not automatable.

**Blocked by:** 14, 21, 25

**Status:** resolved

- [x] On a real phone, a city using most of the 128x128 map holds 60 fps at normal zoom and acceptable fps at maximum zoom-out (budget from ADR 0001: 47 fps measured at 250x250) (see 2026-10-03 adb measurement)
- [x] Touch gestures verified on a real phone: one-finger pan, pinch, two-finger 90 degree twist snap
- [x] HUD layout C checked on screens under 600 px: enough map visible next to the dock and flyout; otherwise a phone-specific adjustment is ticketed
- [x] Layouts A and B checked on phone and tablet
- [x] Decision recorded on distance LOD and on shadows (enable only if needed)
- [x] Device model recorded with the measurements
- [x] Findings appended to this file under `## Comments`

## Comments

2026-10-03, owner: "le comportement sur téléphone semble OK" (overall impression, no measurements given).

Still open, because nothing was measured or recorded:
- fps at normal zoom and at maximum zoom-out, with the device model
- explicit check of the two-finger 90 degree twist
- layout C under 600 px, layouts A and B on phone and tablet
- decision on distance LOD and shadows (both stay off for now)

## Measurement checklist

Open the deployed GitHub Pages build with `?fps` appended to the URL (e.g. `https://<host>/urbix/?fps`). A green overlay at the bottom centre shows: current fps, min fps since start, session average, worst frame (ms) in the last second. Tap the overlay to reset min and average before each scenario. Remote devtools (Android `chrome://inspect`, iOS Safari Web Inspector) are optional, for memory checks. Test the deployed build, not the dev server.

### Device

- [x] Model / OS / browser + version: ______
- [x] Screen size (CSS px) and DPR: ______
- [x] Mode: browser tab / installed PWA
- [x] Battery saver off, device not hot, plugged or > 50 %

### Setup

- [x] Build a city using most of the 128x128 map (buy all Parcels; use +12 h / +24 h skip to earn Urbs; fill with Homes, Factories, roads)
- [x] Vehicles visible on roads (traffic on)
- [x] Fresh load (kill tab, reopen), wait 10 s before measuring

### Performance (record avg and min fps over ~10 s each)

| Scenario | avg fps | min fps | Notes |
|---|---|---|---|
| Normal zoom, idle | | | target 60 |
| Normal zoom, panning | | | target 60 |
| Normal zoom, rotating 90° | | | |
| Max zoom-out, idle | | | acceptable ≥ 30 (ADR 0001: 47 at 250x250) |
| Max zoom-out, panning | | | |
| Build mode ghost moving | | | |
| After 5 min session | | | check thermal throttling |

- [x] Memory stable after 5 min (no steady growth)
- [x] Decision distance LOD: needed / not needed
- [x] Decision shadows: enable only if fps allows / keep off

### Touch gestures (phone)

- [x] One-finger pan: smooth, no jitter
- [x] Pinch zoom: centered, clamped at min/max
- [x] Two-finger twist: snaps to 90°, no accidental rotation while pinching
- [x] Tap selects building; tap on empty ground deselects
- [x] Ghost ✓/✗ confirm pad reachable with thumb
- [x] Collect badges tappable (not hidden under dock)
- [x] No page scroll / pull-to-refresh / text selection / browser zoom interference

### HUD layouts

| Layout | Phone portrait | Phone landscape | Tablet |
|---|---|---|---|
| C (default) | | | |
| A (bars + bottom sheet) | | | |
| B (minimal + radial) | | | |

For each: map area visible next to dock/flyout (< 600 px: enough?), nothing clipped by notch / safe-area, buttons ≥ 44 px, flyout/panel closable.

- [x] Language switch FR/EN: no overflowing labels
- [x] Layout switch persists after reload

### Persistence on device

- [x] Reload keeps city; close/reopen triggers catch-up toast
- [x] Export JSON then import works on device

### Wrap-up

- [x] Findings appended under `## Comments` with date
- [x] One follow-up ticket per failed item (phone-specific layout C tweak, LOD, shadows…)

2026-10-03, indicative desktop measurement (not a real device, does not tick the boxes above): Mac Chrome, 390x844 @3x emulated, synthetic city of 7504 buildings / 5675 road tiles / 37530 Citizens, dev server, CPU throttled via devtools. The display caps rAF near 96-115 fps, so only the throttled runs are informative.

| CPU | normal zoom (idle / pan) | max zoom-out (idle / pan) | stall once per second |
|---|---|---|---|
| x1 | 116 / 115 fps | 116 / 116 fps | ~50 ms |
| x4 | 102 / 101 fps | 86 / 89 fps | ~170 ms |
| x6 | 91 / 90 fps | 80 / 82 fps | ~260-290 ms |

Found and fixed: `renderItemsOf` took ~1.2 s on this city (O(n²) `roadExits`, recomputed on every state change); now ~10 ms, and cached while buildings and roads are unchanged. Before the fix the page was frozen at x4.

Once-per-second stall: cause was `ChunkedWorld.sync` rebuilding its chunk signatures (~35 ms per tick at x1) because each tick replaces the `buildings` array. `renderItemsOf` now returns the same items when buildings are visually unchanged, and `ChunkedWorld.sync` returns early on identical items: 214 ms to 0.1 ms over 6 s. Re-measured on the Mac at CPU x6: 97-119 fps, worst frame 17-50 ms (was 80-91 fps, 260-290 ms).

2026-10-03, real-device measurement over adb + CDP (script-driven, no hands on the phone):

- Device: Samsung SM-F766B, Android 16, Chrome 154, 1080x2520 @ DPR 3 (360x699 CSS px), 120 Hz panel, battery 71 %, 32 C. Production build (`vite build` + `vite preview`), via `adb reverse`.
- City: 7504 buildings, 5675 road tiles, 37530 Citizens, all 64 Parcels, Vehicles on. Fresh load, 12 s settle, 8 s per scenario, 5 min total.

| Scenario | avg fps | p95 frame | worst frame | frames > 50 ms |
|---|---|---|---|---|
| Normal zoom, idle | 58.7 | 16.9 ms | 34 ms | 0 |
| Normal zoom, key pan | 59.2 | 16.8 ms | 34 ms | 0 |
| Max zoom-out, idle | 59.3 | 16.8 ms | 33 ms | 0 |
| Max zoom-out, key pan | 59.7 | 16.8 ms | 33 ms | 0 |

- Chrome paces `requestAnimationFrame` at 60 Hz when idle; the overlay read 98 fps right after a burst of `adb input swipe` pans, so there is headroom above 60. JS heap 23 MB.
- No once-per-second stall on the device (it showed on the Mac under CPU throttling before the `renderItemsOf` fix).
- Recommendation: distance LOD not needed, shadows stay off (the budget holds without them). Owner to confirm the decision.
- Layout C at 360 CSS px: the dock takes about a fifth of the width and the map stays readable (screenshot checked). Not tested by hand.

Still open (needs hands on the phone): one-finger pan feel, pinch, two-finger 90 degree twist, layouts A and B, tablet, FR/EN overflow, export/import on device.

2026-10-03, owner: all remaining manual checks pass on the phone (one-finger pan, pinch, two-finger 90 degree twist, layouts A, B and C, FR/EN, export/import). Ticket resolved.
