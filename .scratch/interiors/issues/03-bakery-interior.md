# Bakery interior

Status: resolved
Blocked by: 01

- Models and Fixture defs: kneader, oven, pipes or heat, conveyors, drawn in Blender.
- Drive and Flow Links, and an assembly line (Line of Packets) from the entry to the Counter.
- baker carries the speed part, seller the sales rate of the existing Counter, technician repairs. No new Takings.
- Done when: a Bakery with no seller sells as before, and tests cover the line, the parts and wear.

## Answer

Done. The Bakery is a Line interior (`layout.line` in `interiors.json`): Fixtures of kind `bakery` (Motor, Shaft, Gear, Bevels, Tank, Pump, Pipes, `bakeryMixer` at the head of the Line, `bakeryOven` on Flow, Conveyors reusing the Packhouse models, `bakeryCounter` as its Exit, walls). `lineBonusOf` adds the speed of the linked Machines and the sales of the linked Exits once the Line is unbroken, saturating towards the caps of the Tier; the baker delivers the speed part, the seller the sales part (`saleIntervalOf` shortens the Counter's interval, with no new Takings), and `advanceProduction` slows a running entry or a sale by what the Fill rate lacks. The engine, the shell, the build menu and the Management view are shared with the other Line interiors (Dairy, Storehouse), whose models are registered and still reserved.
