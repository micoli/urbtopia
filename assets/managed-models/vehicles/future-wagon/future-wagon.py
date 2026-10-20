"""Futuristic train coach: silver and graphite shell, cyan window band between pillars, cyan light strips, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("hull", "#303746"), ("hull_deep", "#181c26"), ("silver", "#d6dae4"), ("cyan", "#3ee6f2"), ("steel", "#6b7384")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 4.2, 1.3, 0.3, 0.9
HW = WIDTH / 2
END = dict(length=0.4, drop=0.1, tip=0.8, rise=0.0, steps=2, power=1.0)
DOORS = [(-1.72, -1.02), (1.02, 1.72)]
pick = cb.banded(P, [(0.15, "hull_deep"), (0.2, "cyan"), (0.4, "silver"), (0.46, "hull_deep"), (0.72, "cyan"), (0.78, "hull_deep")], "silver", roof="silver",
                 door_zones=DOORS, door_replace=("cyan",), door_fill="hull_deep", door_zf=(0.4, 0.8))
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ROUNDED, breaks=(0.15, 0.2, 0.4, 0.46, 0.72, 0.78), front=END, rear=END, cap="hull_deep", cuts=cb.zone_cuts(DOORS))]

z_lo, z_hi = Z0 + HEIGHT * 0.46, Z0 + HEIGHT * 0.72
parts += cb.window_pillars(P, "hull_deep", -0.95, 0.95, 7, z_lo, z_hi, HW, width=0.05)
parts += cb.underbody(P, LENGTH, HW, Z0, color="hull_deep", dark2="hull", spans=((-0.5, 0.6), (0.6, 0.5)))
for y in (-1.3, 1.3):
    parts += cb.truck(P, y, track=0.52, r=0.17, spacing=0.48, frame="hull_deep")
for sign in (-1, 1):
    parts += cb.sliding_door(P, sign * 1.37, Z0 + 0.1, Z0 + 0.78, HW, frame="hull_deep", glass="cyan", width=0.52)
    parts.append(lpm.box("end gangway", (0.62, 0.02, 0.58), at=(0, sign * (LENGTH / 2 + 0.01), Z0 + 0.14), color=P["hull_deep"]))
parts.append(lpm.box("roof fin", (0.08, 3.0, 0.07), at=(0, 0, Z0 + HEIGHT - 0.01), color=P["steel"], taper=(0.6, 1.0)))
parts.append(lpm.box("roof light strip", (0.04, 2.6, 0.02), at=(0, 0, Z0 + HEIGHT + 0.06), color=P["cyan"]))
for side in (-1, 1):
    parts.append(lpm.box("fender", (0.04, 2.0, 0.05), at=(side * (HW + 0.01), 0, Z0 + 0.08), color=P["hull_deep"]))

tk.build("FutureWagon", parts, COLORS, tk.out_dir(__file__), budget=9000)
