# Bakery assignments: bakers to Ovens, sellers to Display counters

Status: resolved
Blocked by: 03
Decisions: ADR 0073, glossary terms Assignment, Recipe, Sold Good.

- A baker is assigned to an Oven with a Recipe (a Good the Bakery produces, unlocked); a seller to a Display counter with a Sold Good (a Good its Counter sells, unlocked). One Staff per Fixture, one Fixture per Staff, like a Restocker and its Exit.
- Assigning needs a Recipe or a Sold Good chosen first; selling or moving the Fixture frees the Staff.
- The speed of an Oven applies only to productions of its Recipe, and only while a baker is assigned; the sales rate and the yield of a Display counter apply only to sales of its Sold Good, while a seller is assigned. Counted in proportion to the Fill rate (ADR 0071).
- A Staff hired and not assigned does nothing and is paid all the same. A Bakery with no assignment produces and sells as before, with no bonus.
- Posts: bakers `0, 1, 1, 2, 2`, sellers `0, 1, 2, 3, 3`.
- Commands and saved state like the Restocker's (optional fields on the Fixture, no new save version); the Fixture panel gets a Recipe or Sold Good choice and an assign button.
- Done when: tests cover the assignment rules, the per-Good effect, the freeing on sale or move and the save, and the Fixture panel lets the player assign.

## Answer

Done. A Fixture of the Bakery that takes Staff declares `assigns` (`baker` on the Ovens, `seller` on the Display counter) and keeps `recipe` or `soldGood` and `assigned` in the saved Fixture (optional fields, no new save version). `interiorAssignments.ts` holds `SetInteriorFocus`, `AssignInteriorStaff` and `UnassignInteriorStaff`; releasing a Staff, moving a Fixture or clearing its Good frees the assignment. With `assignments` set in the layout of the Bakery, `assignedBonusOf` adds the speed per Recipe and the sales and yield per Sold Good, so `saleIntervalOf` and the production and sale delays now take the Good. The report of the Line is cached by layout, which leaves out the assignments: the bonus reads the Fixtures from the interior itself.
