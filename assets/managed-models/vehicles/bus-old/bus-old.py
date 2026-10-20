"""Old city bus: cream shell over a red lower body, row of framed blue windows between cream pillars, chrome bumper, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("cream", "#efe3c4"), ("bus_red", "#c9352f"), ("pane", "#1f5fc4"), ("roof_cream", "#e4d6b4")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 4.3, 1.46, 0.3, 1.0
HW = WIDTH / 2
END = dict(length=0.2, drop=0.1, tip=0.9, steps=2, power=1.0)
DOORS = [(-1.88, -1.2)]
pick = cb.banded(P, [(0.07, "dark"), (0.4, "bus_red"), (0.46, "chrome"), (0.8, "pane")], "cream", roof="roof_cream",
                 door_zones=DOORS, door_replace=("pane",), door_fill="cream", door_zf=(0.46, 0.8), door_side=1)
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ROUNDED, breaks=(0.07, 0.4, 0.46, 0.8), front=END, rear=END, cap="bus_red", cuts=cb.zone_cuts(DOORS))]

z_lo, z_hi = Z0 + HEIGHT * 0.46, Z0 + HEIGHT * 0.8
parts += cb.window_pillars(P, "cream", -1.1, 1.8, 7, z_lo, z_hi, HW, width=0.09, sides=(-1,))
parts += cb.window_pillars(P, "cream", -1.1, 1.8, 7, z_lo, z_hi, HW, width=0.09, sides=(1,))
parts += cb.window_pillars(P, "cream", -1.9, -1.1, 2, z_lo, z_hi, HW, width=0.09, sides=(-1,))
parts += cb.sliding_door(P, -1.54, Z0 + 0.1, z_hi + 0.04, HW, frame="bus_red", glass="pane", width=0.56, sides=(1,))
front, rear = -LENGTH / 2 - 0.01, LENGTH / 2 + 0.01
parts += [lpm.box("windscreen", (WIDTH * 0.8, 0.03, HEIGHT * 0.34), at=(0, front - 0.005, Z0 + HEIGHT * 0.46), color=P["pane"]),
          lpm.box("windscreen pillar", (0.06, 0.04, HEIGHT * 0.34), at=(0, front - 0.01, Z0 + HEIGHT * 0.46), color=P["cream"]),
          lpm.box("destination", (0.7, 0.03, 0.1), at=(0, front - 0.005, Z0 + HEIGHT * 0.83), color=P["dark"]),
          lpm.box("rear window", (WIDTH * 0.62, 0.03, HEIGHT * 0.3), at=(0, rear, Z0 + HEIGHT * 0.5), color=P["pane"]),
          lpm.box("grille", (0.6, 0.03, 0.14), at=(0, front - 0.005, Z0 + 0.14), color=P["chrome"])]
parts += cb.front_face(P, Z0, HW, front, Z0 + 0.2, bumper="chrome")
parts += cb.rear_face(P, Z0, HW, rear, Z0 + 0.28, bumper="chrome")
parts += cb.bus_wheels(P, HW, (-0.95, 1.3))
for side in (-1, 1):
    parts += cb.side_mirror(P, side, -LENGTH / 2 + 0.35, Z0 + HEIGHT * 0.62, HW)
parts.append(lpm.box("roof hatch", (0.6, 0.8, 0.05), at=(0, 0.5, Z0 + HEIGHT - 0.02), color=P["cream"], taper=(0.85, 0.9)))
parts.append(lpm.box("roof vent", (0.3, 0.3, 0.05), at=(0, -0.9, Z0 + HEIGHT - 0.02), color=P["cream"]))

tk.build("BusOld", parts, COLORS, tk.out_dir(__file__), budget=9000)
