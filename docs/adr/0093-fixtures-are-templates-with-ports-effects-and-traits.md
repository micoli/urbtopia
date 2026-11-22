---
status: accepted
---

# Fixtures are templates with ports, effects and traits

The 519 Fixtures were 519 files, one per venue and piece, with a different set of fields for each kind of venue: `drive`, `flow`, `rim`, `lineIn` and `lineOut` for the Factory and the Packhouse, `ports` for the Engine room, a scalar by role for the bonuses. A wall copied in nineteen venues, a pipe in two plants. The Circuits of the Engine room were flowcharts of family names in the balance file. Adding a piece meant touching three places, and a piece could not be shared.

## Decisions

- **One file, many venues.** A Fixture template lists its `venues`, with `ids` for the ids that do not follow the rule and `overrides` for what differs in one venue. The game unfolds it into one Fixture per venue, with the id venue + Name, so `FixtureId`, the saves, the Codex and the tests keep their ids. 519 Fixtures are 276 files, 43 of them shared.
- **A Fixture says what it is, how it connects and what it brings.** `family` and `role` stay the key of the behaviour in code. The connections are `ports` (side, Medium, in, out or both, optional): Drive, the rim of a Gear, Flow and the Line are ports of the media `drive`, `gear`, `flow` and `line`, like the media of the Engine room. The numbers are `bonuses`, the flags and words `traits`, the rules of the pose `placement`, the look `visual`. The vocabularies are closed, in `venueVocabulary.ts`; the behaviour stays coded.
- **A venue checks what it reads.** Each unfolded Fixture is checked against the strict schema of its venue, so a shared template cannot give a venue a field it ignores. That schema stands for the allow-lists: the day the venues carry them as data, the schema goes.
- **The Circuits are derived.** [ADR 0092](0092-the-engine-room-is-the-production-interior-of-a-power-plant.md) listed the flowchart of each plant in the balance file. A Circuit now grows from its anchor, the Fixture that carries the `generation` effect: each required port is met by a Fixture of another family, reached through the links, that nothing else uses, and the ports of that Fixture are met in turn. The optional ports (the smoke of the boiler) make the Circuit cleaned. The caps by Tier stay in the balance file.
- **One order file for the Fixtures.** `assets/defs/order/fixtures.json` lists the Fixtures that the templates unfold into; the order of the templates themselves is in `order/fixtureTemplates.json`.

## Considered options

- **A `type` field.** Rejected: `family` and `role` already name the behaviour.
- **Fixture ids with no venue.** Rejected: the saves and the tests name the Fixtures by venue.
- **A generator of connector shapes** (straight, elbow, tee, cross) from one file per medium. Rejected for now: the names, models and prices differ by shape, so the file would only save the list of ports.
- **Deriving the circuit from the media alone.** Rejected: the Geothermal chain carries steam through three stages, so the media do not tell which Fixture feeds which; the family rule and the reach do.

## Consequences

- The Engine room tests, the Factory and Packhouse tests and the Codex goldens pass unchanged; the goldens of the unfolded Fixtures and of the Codex pages stand as the safety net of any later change.
- `CONTEXT.md` gains Fixture template, Port and Effect; Medium and Circuit are amended.
- The flat shape of a Fixture (`speed`, `yield`, `quality`…) stays what the venues read at run time; the templates are what the files hold.
