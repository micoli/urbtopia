# Drawbridge openings as a closed fraction of time

Accepted. Extends ADR 0018 (Water tiles, Boats and Bridges) and respects ADR 0011 (congestion is a core model, Vehicles are its visual projection).

A Bridge opens in two when a Boat has to pass beneath it, and stops the traffic on its Road tiles like a red light. The effect is a gameplay one: it lowers the capacity of the Bridge, so it weighs on Congestion and Well-being. It therefore lives in the pure core, not in the scene.

The core does not simulate openings. It computes, for each Bridge, a **closed fraction**: the share of time the Bridge is raised, from the number of Boats that can reach it. A Boat reaches a Bridge when its Water tile belongs to the connected body of water that contains the Bridge. Each Boat adds a fixed share (`openingsPerBoatHour` × `minutesPerOpening` / 60), capped by `maxClosed` so that a Bridge never loses all its capacity, as for the pedestrian cut of a Crossing. The capacity of every Bridge tile is multiplied by `1 − closed fraction` at the one place where section capacity is computed. The fraction is constant over a game hour and depends on nothing but the saved state, so Catch-up stays deterministic and no new state is saved.

The scene shows a projection of this model. A Bridge really lifts when a drifting Boat wants to pass: its leaves rise, Vehicles stop before it, and cars already on the deck clear it first. This animation reads the core and is read by nothing: it is neither saved nor fed back, and it does not have to match the closed fraction frame by frame.

Simulating the openings in the core from Boat trajectories was rejected: the drift of Boats is cosmetic, random and unsaved (ADR 0018), so the core would depend on the scene. Letting the scene alone decide, with no effect on capacity, was rejected because the player asked for a real cost. The price is that the visible openings and the modelled share of time can differ: the values are tunable in `.scratch/water/balancing.md`.
