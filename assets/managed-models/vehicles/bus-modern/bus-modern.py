"""Modern city bus: blue shell, dark glass band between pillars, white roof module, double doors, big windscreen, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("bus_blue", "#2a5fd0"), ("blue_dark", "#1d44a0"), ("pane", "#1b2a4a"), ("roof_light", "#3c74e0")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 4.9, 1.5, 0.3, 1.08
HW = WIDTH / 2
END = dict(length=0.22, drop=0.12, tip=0.92, steps=2, power=1.0)
DOORS = [(-2.07, -1.23), (0.03, 0.87)]
pick = cb.banded(P, [(0.07, "dark"), (0.42, "bus_blue"), (0.86, "pane")], "bus_blue", roof="roof_light", windscreen=None,
                 door_zones=DOORS, door_replace=("pane",), door_fill="bus_blue", door_zf=(0.42, 0.86), door_side=1)
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.PASSENGER, breaks=(0.07, 0.42, 0.86), front=END, rear=END, cap="bus_blue", cuts=cb.zone_cuts(DOORS))]

z_lo, z_hi = Z0 + HEIGHT * 0.42, Z0 + HEIGHT * 0.86
parts += cb.window_pillars(P, "bus_blue", -1.9, 2.1, 10, z_lo, z_hi, HW, width=0.08, sides=(-1,))
parts += cb.window_pillars(P, "bus_blue", -1.2, 2.1, 11, z_lo, z_hi, HW, width=0.08, sides=(1,), skip=DOORS)
for y in (-1.65, 0.45):
    parts += cb.sliding_door(P, y, Z0 + 0.1, z_hi, HW, frame="blue_dark", glass="pane", width=0.74, sides=(1,))
front, rear = -LENGTH / 2 - 0.01, LENGTH / 2 + 0.01
parts += [lpm.box("windscreen", (WIDTH * 0.84, 0.03, HEIGHT * 0.44), at=(0, front - 0.005, Z0 + HEIGHT * 0.42), color=P["pane"]),
          lpm.box("windscreen pillar", (0.05, 0.04, HEIGHT * 0.44), at=(0, front - 0.01, Z0 + HEIGHT * 0.42), color=P["bus_blue"]),
          lpm.box("destination", (0.9, 0.03, 0.11), at=(0, front - 0.005, Z0 + HEIGHT * 0.9), color=P["dark"]),
          lpm.box("destination glow", (0.7, 0.032, 0.05), at=(0, front - 0.008, Z0 + HEIGHT * 0.9 + 0.03), color=P["signal"]),
          lpm.box("rear window", (WIDTH * 0.6, 0.03, HEIGHT * 0.3), at=(0, rear, Z0 + HEIGHT * 0.5), color=P["pane"]),
          lpm.box("grille", (0.7, 0.03, 0.1), at=(0, front - 0.005, Z0 + 0.17), color=P["black"])]
for x in (-0.3, 0.0, 0.3):
    parts.append(lpm.box("grille slat", (0.02, 0.035, 0.1), at=(x, front - 0.008, Z0 + 0.17), color=P["hub"]))
for z in (0.12, 0.22, 0.32):
    parts.append(lpm.box("rear grille", (0.7, 0.03, 0.04), at=(0, rear + 0.005, Z0 + z), color=P["black"]))
parts += cb.front_face(P, Z0, HW, front, Z0 + 0.2)
parts += cb.rear_face(P, Z0, HW, rear, Z0 + 0.34)
parts += cb.bus_wheels(P, HW, (-0.75, 1.65))
for side in (-1, 1):
    parts += cb.side_mirror(P, side, -LENGTH / 2 + 0.3, Z0 + HEIGHT * 0.7, HW)
parts += cb.roof_unit(P, 0.9, Z0 + HEIGHT - 0.02, width=0.95, length=1.4, colour="roof_light", vents=4)
parts += cb.roof_unit(P, -1.2, Z0 + HEIGHT - 0.02, width=0.7, length=0.6, colour="roof_light", vents=2)
parts.append(lpm.box("wiper", (0.4, 0.03, 0.02), at=(-0.28, front - 0.012, Z0 + HEIGHT * 0.46), color=P["black"]))
parts.append(lpm.box("stop button strip", (0.02, 3.4, 0.03), at=(HW + 0.004, 0.2, Z0 + HEIGHT * 0.5), color=P["signal"]))

tk.build("BusModern", parts, COLORS, tk.out_dir(__file__), budget=9000)
