# 26: Real-device performance and touch pass

**What to build:** A human verifies the MVP on real devices and records findings; follow-up tickets are created for any failure. Not automatable.

**Blocked by:** 14, 21, 25

**Status:** ready-for-human

- [ ] On a real phone, a city using most of the 128x128 map holds 60 fps at normal zoom and acceptable fps at maximum zoom-out (budget from ADR 0001: 47 fps measured at 250x250)
- [ ] Touch gestures verified on a real phone: one-finger pan, pinch, two-finger 90 degree twist snap
- [ ] HUD layout C checked on screens under 600 px: enough map visible next to the dock and flyout; otherwise a phone-specific adjustment is ticketed
- [ ] Layouts A and B checked on phone and tablet
- [ ] Decision recorded on distance LOD and on shadows (enable only if needed)
- [ ] Device model recorded with the measurements
- [ ] Findings appended to this file under `## Comments`

## Comments

2026-10-03, owner: "le comportement sur téléphone semble OK" (overall impression, no measurements given).

Still open, because nothing was measured or recorded:
- fps at normal zoom and at maximum zoom-out, with the device model
- explicit check of the two-finger 90 degree twist
- layout C under 600 px, layouts A and B on phone and tablet
- decision on distance LOD and shadows (both stay off for now)

## Measurement checklist

No FPS counter ships in the app. Measure with remote devtools: Android = Chrome `chrome://inspect` + Performance panel (FPS meter / "Rendering > Frame Rendering Stats"); iOS = Safari Web Inspector (Timelines > Frames) via Mac. Test on the deployed GitHub Pages build, not dev server.

### Device

- [ ] Model / OS / browser + version: ______
- [ ] Screen size (CSS px) and DPR: ______
- [ ] Mode: browser tab / installed PWA
- [ ] Battery saver off, device not hot, plugged or > 50 %

### Setup

- [ ] Build a city using most of the 128x128 map (buy all Parcels; use +12 h / +24 h skip to earn Urbs; fill with Homes, Factories, roads)
- [ ] Vehicles visible on roads (traffic on)
- [ ] Fresh load (kill tab, reopen), wait 10 s before measuring

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

- [ ] Memory stable after 5 min (no steady growth)
- [ ] Decision distance LOD: needed / not needed
- [ ] Decision shadows: enable only if fps allows / keep off

### Touch gestures (phone)

- [ ] One-finger pan: smooth, no jitter
- [ ] Pinch zoom: centered, clamped at min/max
- [ ] Two-finger twist: snaps to 90°, no accidental rotation while pinching
- [ ] Tap selects building; tap on empty ground deselects
- [ ] Ghost ✓/✗ confirm pad reachable with thumb
- [ ] Collect badges tappable (not hidden under dock)
- [ ] No page scroll / pull-to-refresh / text selection / browser zoom interference

### HUD layouts

| Layout | Phone portrait | Phone landscape | Tablet |
|---|---|---|---|
| C (default) | | | |
| A (bars + bottom sheet) | | | |
| B (minimal + radial) | | | |

For each: map area visible next to dock/flyout (< 600 px: enough?), nothing clipped by notch / safe-area, buttons ≥ 44 px, flyout/panel closable.

- [ ] Language switch FR/EN: no overflowing labels
- [ ] Layout switch persists after reload

### Persistence on device

- [ ] Reload keeps city; close/reopen triggers catch-up toast
- [ ] Export JSON then import works on device

### Wrap-up

- [ ] Findings appended under `## Comments` with date
- [ ] One follow-up ticket per failed item (phone-specific layout C tweak, LOD, shadows…)
