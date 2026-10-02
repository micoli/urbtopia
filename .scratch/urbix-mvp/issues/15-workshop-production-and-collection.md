# 15: Workshop production and collection

**What to build:** The player queues Materials in a Workshop, waits in real time, then collects them into the Storehouse. First end-to-end production loop, with the Storehouse and collect badges.

**Blocked by:** 14

**Status:** ready-for-agent

- [ ] Workshop has a FIFO queue of 2 Slots; a Slot stores `startedAt` and `duration`; Wood (1 min) and Stone (2 min) available
- [ ] `advance(now)` completes Slots at `startedAt + duration`; finished output waits on the building until collected
- [ ] One Storehouse per city with two compartments (Materials 20, Goods 40); can be placed and sold under the rules of ticket 13
- [ ] Collect is refused when the compartment is full; finished output stays safe in its Slot; `StorageFull` event emitted
- [ ] Floating collect badges appear above buildings with ready output; a tap collects
- [ ] Detail panel shows queue, remaining time per Slot, and queue controls
- [ ] Core tests with a simulated clock cover completion order, full Storehouse and collection
- [ ] Moving a building resets its running production (carried over from ticket 13)
- [ ] Selling a Storehouse is refused if its remaining capacity would be below the stock (carried over from ticket 13)
