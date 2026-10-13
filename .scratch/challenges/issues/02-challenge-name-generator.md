# Challenge name generator

Status: needs-triage
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [ ] Pure function `(keys) -> name` in the core or i18n layer: hook phrase + main item, deterministic, no clock or random.
- [ ] Separate hook lists for Daily and Event, in FR and EN; word lists live in the i18n files.
- [ ] An Event with a hand-written translated name uses it; the generated name is the fallback only when it is empty.
- [ ] Unit tests: same keys give the same name, both languages, fallback, every item of the catalogue has a theme word.
