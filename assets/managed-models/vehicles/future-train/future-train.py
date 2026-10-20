"""Futuristic train head: silver and graphite shell, cyan window band framed in black, light strips, sharp nose, front at -Y."""
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
NOSE = dict(length=1.3, drop=0.46, tip=0.4, rise=0.12, steps=6, power=1.3)
TAIL = dict(length=0.4, drop=0.1, tip=0.8, rise=0.0, steps=2, power=1.0)
ZONES = [(-9.0, -0.4), (0.95, 9.0)]
pick = cb.banded(P, [(0.15, "hull_deep"), (0.2, "cyan"), (0.4, "silver"), (0.46, "hull_deep"), (0.72, "cyan"), (0.78, "hull_deep")], "silver", roof="silver", windscreen="cyan",
                 door_zones=ZONES, door_replace=("cyan",), door_fill="hull_deep", door_zf=(0.4, 0.8))
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ROUNDED, breaks=(0.15, 0.2, 0.4, 0.46, 0.72, 0.78), front=NOSE, rear=TAIL, cap="hull_deep", cuts=cb.zone_cuts(ZONES))]

z_lo, z_hi = Z0 + HEIGHT * 0.46, Z0 + HEIGHT * 0.72
parts += cb.window_pillars(P, "hull_deep", -0.35, 0.9, 5, z_lo, z_hi, HW, width=0.05)
parts += cb.underbody(P, LENGTH - 1.1, HW, Z0, color="hull_deep", dark2="hull", spans=((0.1, 0.5), (1.0, 0.5)), y_shift=0.55)
for y in (-1.15, 1.35):
    parts += cb.truck(P, y, track=0.52, r=0.17, spacing=0.48, frame="hull_deep")
parts += cb.sliding_door(P, 1.35, Z0 + 0.1, Z0 + 0.78, HW, frame="hull_deep", glass="cyan", width=0.52)
front = -LENGTH / 2 - 0.01
parts.append(lpm.box("nose light bar", (0.5, 0.025, 0.045), at=(0, front, Z0 + 0.24), color=P["cyan"]))
for x in (-0.28, 0.28):
    parts.append(lpm.box("nose light", (0.14, 0.025, 0.05), at=(x, front, Z0 + 0.34), color=P["headlight"]))
parts.append(lpm.box("tail end", (WIDTH - 0.3, 0.05, 0.6), at=(0, LENGTH / 2 + 0.02, Z0 + 0.12), color=P["hull_deep"]))
parts.append(lpm.box("roof fin", (0.08, 1.8, 0.07), at=(0, 1.1, Z0 + HEIGHT - 0.01), color=P["steel"], taper=(0.6, 1.0)))
parts.append(lpm.box("roof light strip", (0.04, 1.5, 0.02), at=(0, 1.1, Z0 + HEIGHT + 0.06), color=P["cyan"]))
for side in (-1, 1):
    parts.append(lpm.box("fender", (0.04, 1.4, 0.05), at=(side * (HW + 0.01), -1.1, Z0 + 0.08), color=P["hull_deep"]))

tk.build("FutureTrain", parts, COLORS, tk.out_dir(__file__), budget=9000)
