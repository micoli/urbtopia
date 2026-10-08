# 02: Fixture editing and the full Arcade catalogue

**What to build:** In the Management view the player can place, move, rotate and remove every Arcade Fixture, with the walls, floor and door of the Mini Arcade pack framing the interior, and gets refunded when removing.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The Arcade Fixture catalogue is data (id, model key, footprint, price, minimum Venue Tier): counter, arcade machines (two recolors named barrel climber and space shooter, no trademarked names), air hockey, billiard table, pinball, claw machine, basketball game, dance machine, prize wheel, ticket machine, vending machine, table, chair, bar stool. `gambling-machine` is not included.
- [ ] The billiard table uses the Poly Pizza model "Pool Table" by Evol-Love (https://poly.pizza/m/7GzmqI1M0fC, CC-BY 3.0): downloaded like the other Poly Pizza assets (with its `license.txt`), given a Model definition, and its attribution shown in the credits.
- [ ] Fixtures can be placed on free cells, moved, rotated by 90 degrees and removed; removing refunds 50% of the purchase price; invalid cells (occupied, outside the grid) are refused and shown.
- [ ] Fixtures locked above the Venue Tier are shown with the required Tier.
- [ ] A Fixture cannot block the entrance.
- [ ] The interior shell (walls, floor, door, column) is drawn from the Mini Arcade pack and reflects the grid size.
- [ ] Fixture positions and rotations are saved and restored; occupancy is rebuilt on load.
- [ ] Footprint and placement rules tested headless.
- [ ] FR/EN names and descriptions; Codex entry lists the Fixtures.
