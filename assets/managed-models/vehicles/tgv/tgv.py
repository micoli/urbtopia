"""High-speed train head: white aerodynamic shell, blue stripe, long pointed nose with a dark windscreen, window band, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("blue", "#2a5fd0"), ("grey", "#b6bcc8"), ("roof_grey", "#9aa1ae"), ("navy", "#1c3f8a"), ("steel", "#4d5260")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 4.2, 1.3, 0.3, 0.9
HW = WIDTH / 2
NOSE = dict(length=1.25, drop=0.42, tip=0.5, rise=0.1, steps=6, power=1.5)
TAIL = dict(length=0.3, drop=0.0, tip=0.9, rise=0.0, steps=2, power=1.0)
ZONES = [(-9.0, -0.45), (1.3, 9.0)]
pick = cb.banded(P, [(0.17, "steel"), (0.28, "white"), (0.38, "blue"), (0.46, "white"), (0.72, "navy")], "white", roof="roof_grey", windscreen="navy",
                 door_zones=ZONES, door_replace=("navy",), door_fill="white", door_zf=(0.4, 0.8))
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ROUNDED, breaks=(0.17, 0.28, 0.38, 0.46, 0.72), front=NOSE, rear=TAIL, cap="grey", cuts=cb.zone_cuts(ZONES))]

z_lo, z_hi = Z0 + HEIGHT * 0.46, Z0 + HEIGHT * 0.72
parts += cb.window_pillars(P, "white", -0.4, 1.25, 6, z_lo, z_hi, HW, width=0.06)
parts += cb.underbody(P, LENGTH - 1.1, HW, Z0, spans=((0.1, 0.5), (1.0, 0.5)), y_shift=0.55)
for y in (-1.15, 1.35):
    parts += cb.truck(P, y, track=0.52, r=0.17, spacing=0.48)
parts += cb.sliding_door(P, 1.68, Z0 + 0.1, Z0 + 0.78, HW, frame="grey", width=0.52)
front = -LENGTH / 2 - 0.01
for x in (-0.28, 0.28):
    parts += cb.round_lamp(P, x, front, Z0 + 0.2, radius=0.05, colour="headlight", facing=-1),
parts.append(lpm.box("nose coupler cover", (0.34, 0.1, 0.12), at=(0, front - 0.02, Z0 + 0.0), color=P["steel"]))
parts.append(lpm.box("nose stripe", (0.3, 0.02, 0.05), at=(0, front - 0.005, Z0 + 0.34), color=P["blue"]))
parts.append(lpm.box("tail end", (WIDTH - 0.2, 0.05, 0.66), at=(0, LENGTH / 2 + 0.02, Z0 + 0.12), color=P["steel"]))
parts += cb.roof_unit(P, 1.2, Z0 + HEIGHT - 0.02, width=0.5, length=0.7)
parts += cb.roof_unit(P, 2.0, Z0 + HEIGHT - 0.02, width=0.4, length=0.4, vents=2)
for side in (-1, 1):
    parts.append(lpm.box("cab side window", (0.03, 0.34, 0.2), at=(side * (HW + 0.0), -0.9, Z0 + 0.45), color=P["navy"]))

tk.build("Tgv", parts, COLORS, tk.out_dir(__file__), budget=9000)
