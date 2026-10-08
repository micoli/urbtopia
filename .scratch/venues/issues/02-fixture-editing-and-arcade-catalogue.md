# 02: Fixture editing and the full Arcade catalogue

**What to build:** In the Management view the player can place, move, rotate and remove every Arcade Fixture, with the walls, floor and door of the Mini Arcade pack framing the interior, and gets refunded when removing.

**Blocked by:** 01

**Status:** done

- [x] The Arcade Fixture catalogue is data (id, model key, footprint, price, minimum Venue Tier): counter, arcade machines (two recolors named barrel climber and space shooter, no trademarked names), air hockey, billiard table, pinball, claw machine, basketball game, dance machine, prize wheel, ticket machine, vending machine, table, chair, bar stool. `gambling-machine` is not included.
- [x] The billiard table uses the Poly Pizza model "Pool Table" by Evol-Love (https://poly.pizza/m/7GzmqI1M0fC, CC-BY 3.0): downloaded like the other Poly Pizza assets (with its `license.txt`), given a Model definition, and its attribution shown in the credits.
- [x] Fixtures can be placed on free cells, moved, rotated by 90 degrees and removed; removing refunds 50% of the purchase price; invalid cells (occupied, outside the grid) are refused and shown.
- [x] Fixtures locked above the Venue Tier are shown with the required Tier.
- [x] A Fixture cannot block the entrance.
- [x] The interior shell (walls, floor, door, column) is drawn from the Mini Arcade pack and reflects the grid size.
- [x] Fixture positions and rotations are saved and restored; occupancy is rebuilt on load.
- [x] Footprint and placement rules tested headless.
- [x] FR/EN names and descriptions; Codex entry lists the Fixtures.

## Comments

- The entrance is an opening in the north wall with a mat on its cell; no door model is used. The column and `wall-door-rotate` of Mini Arcade are not used.
- Pool Table was downloaded by hand into `assets/poly.pizza/pool-table/`. It is not in the Poly Pizza list that `npm run assets:fetch` refreshes: add https://poly.pizza/m/7GzmqI1M0fC to that list to keep it on refresh. Its attribution shows in the credits through `assets/models.json`.
- Fixtures above Tier 1 are locked until ticket 07 adds Venue Tiers.
- The two arcade machines share one model; the space shooter is the barrel climber tinted blue.
- Follow-up: the build menu of a Venue is the menu of the city. Sections by kind of Fixture (Arcade: games, services, furniture; Supermarket: shelves, checkouts, decor; Hotel: beds, bathroom, comfort, reception), one open at a time, with rows made of the name, the cost and a small picture of the model (`FlyoutItem`), the selected row outlined and the rows above the Tier locked with the Tier they need. The pictures are drawn once per Fixture by an offscreen renderer (`fixturePreview.ts`) and kept, since the Codex pictures only cover buildings.
- Follow-up: the interior has a main menu like the city, in the layout chosen in the settings (side bar with a dock and a flyout, bars with a bottom sheet, or the minimal round menu): Build, Staff, Events, Takings and a return to the city. Nothing is open by default, a panel opens only from its button, and Escape closes what is open one step at a time. A selected Fixture opens its own panel, as a building does in the city. Placing an item ends the add mode; a refused placement keeps it to try another cell.
