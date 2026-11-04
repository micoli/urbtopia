"""Metro trailing car: silver body with a mint stripe and a dark window band between pillars, sliding doors, rounded roof, a plain end at the front and a sloped cab at the back with a tail light, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("silver", "#cfd6de"), ("mint", "#7fc8ae"), ("pane", "#26405e"), ("roof_grey", "#8a909c"), ("steel", "#4d5260")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 3.7, 1.1, 0.2, 0.75
HW = WIDTH / 2
NOSE = dict(length=0.7, drop=0.18, tip=0.78, rise=0.04, steps=4, power=1.3)
END = dict(length=0.2, drop=0.0, tip=0.9, rise=0.0, steps=2, power=1.0)
DOORS = [(-1.2, -0.5), (0.5, 1.2)]
ROOF = [(0.93, 0.0), (1.0, 0.06), (1.0, 0.6), (0.97, 0.76), (0.88, 0.87), (0.7, 0.94), (0.4, 0.985), (0.0, 1.0)]
pick = cb.banded(P, [(0.14, "steel"), (0.36, "silver"), (0.42, "mint"), (0.8, "pane")], "silver", roof="roof_grey", windscreen="pane", roof_width=0.5,
                 door_zones=DOORS, door_replace=("pane",), door_fill="silver", door_zf=(0.36, 0.8))
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=ROOF, breaks=(0.14, 0.36, 0.42, 0.8), front=END, rear=NOSE, cap="silver", cuts=cb.zone_cuts(DOORS))]

parts += cb.window_pillars(P, "silver", -1.7, 1.7, 9, Z0 + HEIGHT * 0.42, Z0 + HEIGHT * 0.8, HW, width=0.06, skip=DOORS)
parts += cb.underbody(P, LENGTH, HW, Z0, spans=((-0.6, 0.4), (0.6, 0.4)))
for y in (-1.15, 1.15):
    parts += cb.truck(P, y, track=0.4, r=0.12, spacing=0.36)
for y in (-0.85, 0.85):
    parts += cb.sliding_door(P, y, Z0 + 0.06, Z0 + HEIGHT * 0.8, HW, frame="silver", glass="pane", width=0.62)
parts.append(lpm.box("end door", (0.4, 0.025, 0.5), at=(0, -(LENGTH / 2 + 0.005), Z0 + 0.1), color=P["pane"]))
parts += cb.round_lamp(P, -0.3, LENGTH / 2 + 0.01, Z0 + 0.18, radius=0.05, colour="taillight", facing=1),
parts += cb.round_lamp(P, 0.3, LENGTH / 2 + 0.01, Z0 + 0.18, radius=0.05, colour="taillight", facing=1),
parts.append(lpm.box("destination", (0.5, 0.03, 0.1), at=(0, LENGTH / 2 + 0.005, Z0 + HEIGHT * 0.84), color=P["pane"]))
for y in (-0.8, 0.8):
    parts += cb.roof_unit(P, y, Z0 + HEIGHT - 0.01, width=0.4, length=0.7, colour="roof_grey")

tk.build("MetroTrainRear", parts, COLORS, tk.out_dir(__file__), budget=9000)
