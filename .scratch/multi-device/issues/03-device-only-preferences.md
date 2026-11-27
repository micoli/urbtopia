# Device-only Preferences

Status: done - implemented
Spec: ../spec.md
Blocked by: none

## What to build

Graphics quality and the touch or desktop layout stay on the device and leave the save. List the exact keys by reading the preference keys in `src/persistence`. Other Preferences keep travelling.

## Acceptance criteria

- [ ] The listed keys are not written in the envelope and survive a Cloud save adoption on the device.
- [ ] A test proves a language change travels and a graphics-quality change does not.
- [ ] A save that already holds these keys loads without error and the device keeps its own value.

## Notes

The device keys are `DEVICE_PREF_KEYS` in `src/i18n/prefsStore.ts`: `layout`, `traffic`, `pedestrians`, `trafficDensity`, `pedestrianDensity`, `sunShadows`, `shinyModels`, `objectShadows`, `pickMode`, `debug`, `debugOffsetX`, `debugOffsetY`. The floating menu keys and `managementTabs` still travel with the City.
