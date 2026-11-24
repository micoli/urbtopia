# Device-only Preferences

Status: ready-for-agent
Spec: ../spec.md
Blocked by: none

## What to build

Graphics quality and the touch or desktop layout stay on the device and leave the save. List the exact keys by reading the preference keys in `src/persistence`. Other Preferences keep travelling.

## Acceptance criteria

- [ ] The listed keys are not written in the envelope and survive a Cloud save adoption on the device.
- [ ] A test proves a language change travels and a graphics-quality change does not.
- [ ] A save that already holds these keys loads without error and the device keeps its own value.
