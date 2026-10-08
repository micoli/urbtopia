# 08: Scheduled events (tournament)

**What to build:** The player schedules an event, paying an Urbs budget, that multiplies the Venue's Visitors for a fixed duration.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Events are available only with a manager; the player picks a start and pays a budget in Urbs, debited at scheduling.
- [ ] During the event Visitors are multiplied for a fixed duration, with an upper bound set by the Venue's Tier and its Fixtures.
- [ ] An event is saved and survives reload and Catch-up; cancelling refunds part of the budget.
- [ ] Only one event at a time; a cooldown follows.
- [ ] Tests cover the multiplier, the cap, Catch-up over an event and the refund.
