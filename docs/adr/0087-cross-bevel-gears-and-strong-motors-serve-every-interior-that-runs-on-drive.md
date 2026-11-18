---
status: accepted
---

# Cross bevel gears and strong motors serve every interior that runs on Drive

Extends [ADR 0085](0085-the-link-engine-is-a-module-of-its-own.md): the Link engine already carries Drive for the twelve Production interiors that have a Motor (Factory, Workshop, Mill, Dairy, Bakery, Textile mill, Knitwear factory, Livestock farm, Storehouse, Packhouse, Recycling plant, Farm). The elbow and the tee of the Bevel gear stop at three ways, and a Motor drives three Machines, so a large layout needs many Motors and long runs of Shafts.

## Decisions

- **A Bevel gear cross.** A fourth cone, toward the back, joins the elbow and the tee, with `drive: [front, right, back, left]`. It takes the Drive on any side and gives it to the three others. A turn reverses between two cones across from each other, as the two side cones of a tee already do, and between two neighbouring cones by the existing rule of signs of axis, so the ring of four cones is always consistent and never jams.
- **A Strong motor, two tiles long, in line.** Its Drive leaves through one end only (`drive: [right]`, the end of the long side), in line with its body, never through its sides or its other end. It declares `strength: 5` (Machines and Pumps it drives, 3 for an ordinary Motor) and `draw: 1.5` (power, as a multiple of an ordinary Motor). The Motors of one group of Drive add their strengths; the group is overloaded past the sum, the highest ids first.
- **The engine opens at the ends of a Fixture.** A side of a Fixture opens onto the cell beyond the tile that lies farthest that way (`cellBeyond`), and the placed Fixtures are indexed by every tile they cover. For a one-tile Fixture nothing changes.
- **One definition per interior.** The two Fixtures are declared in each of the twelve interiors (`<interior>BevelCross`, `<interior>MotorStrong`) with the same prices (260 and 750), the same Tier (3) and the same wear (0.06 and 0.10), and the models `factory-floor-bevel-cross` and `factory-floor-motor-strong`.
- **Power per Machine falls.** A Strong motor draws 1.5 times the power of a Motor for five Machines, against three: 0.3 against 0.33 per Machine. The saving is small, the gain is in the layout (fewer cells of Shafts, one source). Prices and draw are starting values to balance in the definitions.

## Considered options

- **A Motor with a higher strength and the same single tile.** Rejected: it would be the same Fixture with a better number, and no new layout.
- **A Strong motor that gives the Drive on three sides.** Rejected: the Bevel gears already split it; the Strong motor's job is to be a source that drives many Machines from a long run.
- **Output on the front of the origin tile.** Rejected: with two tiles it would depend on which tile is the origin; an end in line with the body is the same whatever the turn.

## Consequences

- `CONTEXT.md` gains Strong motor and extends Bevel gear and Interior economy; the Factory interior Guide page adds both.
- `fixture.schema.json` gains `strength` and `draw`; the 24 new fixture definitions are generated into the id unions.
- The animation of the interior knows the back cone (`spin-ny`).
