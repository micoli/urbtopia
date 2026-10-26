# Export and import as a new City

Status: ready-for-agent
Blocked by: 01
Spec: ../spec.md

## What to build

Export and import adapted to several Cities.

## Acceptance criteria

- [ ] Export saves the open City, with its City name, to a file.
- [ ] Import always creates a new City, named from the file (deduplicated), and never overwrites an existing City.
- [ ] Import is refused with a clear message when the account already has three Cities.
- [ ] Files exported before multi-city import with a Seed-based default name.
