# Supermarket tutorial steps

Type: task
Status: resolved
Blocked by: 01

## What to build

The six Supermarket steps on top of the Venue tutorial mechanism. See `../spec.md`.

## Seams under test

- Step validation for the Supermarket: checkout, shelf, stocked shelf, cashier, collected Takings.
- Order freedom: shelf placed before the checkout still ends on the right step.
- Stock step with an empty Storehouse waits and does not grant Goods.

## Acceptance criteria

- [ ] The six steps validate from `GameState` only and advance automatically.
- [ ] Steps 2 and 3 can be done in any order.
- [ ] The stock step text names the Storehouse (chip) and explains how to get Goods.
- [ ] Texts in `en` and `fr`, story covers a Supermarket step.
- [ ] Typecheck, lint and the full test suite pass.
