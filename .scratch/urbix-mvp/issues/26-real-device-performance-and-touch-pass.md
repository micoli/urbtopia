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
