# Diagnosis in the Waste section

Status: ready-for-agent
Spec: ../spec.md
Blocked by: 01

## What to build

Show the Waste Diagnosis in `WasteSection`, under the balance.

## Acceptance criteria

- [ ] `WasteSection` renders the shared `DiagnosisPanel` with `diagnoseWaste(state)`.
- [ ] Texts for every Cause key in English and French in `src/i18n/catalog.ts`, in the vocabulary of `CONTEXT.md`, with the figures in the sentence.
- [ ] "Show on map" focuses the facility or Home of the Cause.
- [ ] Nothing appears when Waste is under control.
- [ ] Component test and a story with a city that lacks capacity and has a stopped facility.
