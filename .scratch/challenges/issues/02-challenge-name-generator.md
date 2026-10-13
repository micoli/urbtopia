# Challenge name generator

Status: done - 18 i18n tests and eslint pass
Blocked by: none
Spec: ../spec.md

## Acceptance criteria

- [x] Pure function `(keys) -> name` in the core or i18n layer: hook phrase + main item, deterministic, no clock or random.
- [x] Separate hook lists for Daily and Event, in FR and EN; word lists live in the i18n files.
- [x] An Event with a hand-written translated name uses it; the generated name is the fallback only when it is empty.
- [x] Unit tests: same keys give the same name, both languages, fallback, every item of the catalogue has a theme word.
