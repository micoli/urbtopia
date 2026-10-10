# 08: Scheduled events (tournament)

**What to build:** The player schedules an event, paying an Urbs budget, that multiplies the Venue's Visitors for a fixed duration.

**Blocked by:** 05

**Status:** done

- [x] Events are available only with a manager; the player picks a start and pays a budget in Urbs, debited at scheduling.
- [x] During the event Visitors are multiplied for a fixed duration, with an upper bound set by the Venue's Tier and its Fixtures.
- [x] An event is saved and survives reload and Catch-up; cancelling refunds part of the budget.
- [x] Only one event at a time; a cooldown follows.
- [x] Tests cover the multiplier, the cap, Catch-up over an event and the refund.

## Comments

- Rules in `src/core/venues/events.ts` (`EVENT`). One fixed budget by Tier (300 / 600 / 1200 Urbs), a multiplier of Visitors by Tier (x1.5 / x2 / x2.5) for 3 hours, a 6-hour cooldown after it ends. The upper bound from the Fixtures is the capacity itself: extra Visitors are only served up to it.
- Start and end times are boundaries of the Catch-up loop (`venueEventBoundaries`), so a long gap gives the same Takings as stepping through it.
- Cancelling is possible before the start and refunds half of the budget; a started event cannot be cancelled.
