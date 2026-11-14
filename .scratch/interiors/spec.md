# Interiors for Production buildings and Public facilities

Decisions: [ADR 0070](../../docs/adr/0070-interiors-come-in-three-families-venue-production-and-service.md), [0071](../../docs/adr/0071-an-interior-role-carries-its-own-part-of-the-effect.md), [0072](../../docs/adr/0072-public-facilities-pay-the-wages-of-their-service-interior-staff.md). Vocabulary: Production interior, Service interior, Interior economy, Staff in `CONTEXT.md`.

## Scope

One big pull request, in this order: rename (done), ADRs (done), tickets, models, code.

| Interior | Family | Mechanic | Roles | Lever |
| --- | --- | --- | --- | --- |
| Mill | Production | Drive | miller, technician | speed |
| Bakery | Production | Drive + Flow, assembly line | baker, seller, technician | speed, Counter sales rate |
| Dairy | Production | Flow, assembly line | cheesemaker, cream maker, technician | Cheese and Cream yield |
| Storehouse | Production | assembly line | stocker, technician | capacity |
| School | Service | none | teacher | Schooling share of Knowledge |
| Library | Service | none | librarian | Knowledge share |
| Hospital | Service | none | nurse, doctor, surgeon | Well-being of Health coverage |

## Invariants

- An empty interior leaves the building as it was; the bonus never lowers what the Tier gives.
- Caps by Tier, in `assets/defs/balance/` (starting point: +10 % at Tier 1 to +50 % at Tier 5, tuned in play).
- Each role carries its own part of the effect, in proportion to its own Fill rate; the Technician always works.
- Service interiors: no Condition, no Technician, no change of reach or capacity.
- Flags `productionInterior` and `serviceInterior`; a Citizen threshold per interior.
- Fixtures drawn one by one in Blender, texts in English, no commit before the player's approval.
- Home interior unchanged.

## Out of scope

Workshop, Textile mill, Knitwear factory, Livestock farm, Shop, Theaters, Town hall, Police and Fire stations. A Factory assembly line: ticket 11, after the first wave.
