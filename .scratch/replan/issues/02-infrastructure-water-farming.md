# Lift and place infrastructure, Water and farming objects

Status: ready-for-agent
Blocked by: 01

- Lift and place Roads of every Carrier and Level, Bridges (ADR 0043), Pedestrian ways, Walkways, Tunnels, Underground walkways, Metro stations, Pedestrian accesses, Crossings, Water tiles, Fields with Crops (growth kept), Orchard trees, Hives.
- Suspend the refusal rules of ADR 0043, the Water rules (Bridge, Marina, Pirate cove, Desert island, Sea fort) and the last-access rule while lifting.
- A Bridge, a Crossing or a Boat is placed under its own rules once its Road, Water or Marina is placed.
- Done when: tests lift a whole city to an empty map and place it back identical; tests that a Bridge over Water cannot be placed before its Water tiles; `tsc`, lint and tests pass.
