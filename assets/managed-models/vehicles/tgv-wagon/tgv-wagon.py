"""High-speed train coach: white shell, blue stripe, dark window band between pillars, grey ends, front at -Y."""
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
END = dict(length=0.3, drop=0.0, tip=0.9, rise=0.0, steps=2, power=1.0)
DOORS = [(-1.92, -1.24), (1.24, 1.92)]
pick = cb.banded(P, [(0.17, "steel"), (0.28, "white"), (0.38, "blue"), (0.46, "white"), (0.72, "navy")], "white", roof="roof_grey", ends="grey", end_length=0.3, length=LENGTH,
                 door_zones=DOORS, door_replace=("navy",), door_fill="white", door_zf=(0.4, 0.8))
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ROUNDED, breaks=(0.17, 0.28, 0.38, 0.46, 0.72), front=END, rear=END, cap="grey", cuts=cb.zone_cuts(DOORS))]

z_lo, z_hi = Z0 + HEIGHT * 0.46, Z0 + HEIGHT * 0.72
parts += cb.window_pillars(P, "white", -1.2, 1.2, 8, z_lo, z_hi, HW, width=0.07)
parts += cb.underbody(P, LENGTH, HW, Z0, spans=((-0.5, 0.6), (0.6, 0.5)))
for y in (-1.3, 1.3):
    parts += cb.truck(P, y, track=0.52, r=0.17, spacing=0.48)
for sign in (-1, 1):
    parts += cb.sliding_door(P, sign * 1.58, Z0 + 0.1, Z0 + 0.78, HW, frame="grey", width=0.52)
    parts.append(lpm.box("end gangway", (0.62, 0.02, 0.58), at=(0, sign * (LENGTH / 2 + 0.01), Z0 + 0.14), color=P["steel"]))
    parts.append(lpm.box("end gangway frame", (0.7, 0.015, 0.66), at=(0, sign * (LENGTH / 2 + 0.003), Z0 + 0.1), color=P["white"]))
parts += cb.roof_unit(P, -0.8, Z0 + HEIGHT - 0.02, width=0.5, length=0.8)
parts += cb.roof_unit(P, 0.8, Z0 + HEIGHT - 0.02, width=0.5, length=0.8)

tk.build("TgvWagon", parts, COLORS, tk.out_dir(__file__), budget=9000)
