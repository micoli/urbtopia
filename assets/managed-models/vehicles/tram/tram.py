"""Old tram: green lower body, cream upper body with framed windows, raised roof, trolley frame, fender and bogies, front at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import carbody_kit as cb  # noqa: E402
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("tram_green", "#2f7a4a"), ("green_dark", "#1f5434"), ("cream", "#efe3c4"), ("pane", "#1f5fc4"), ("roof_grey", "#4a4c58")]
P = kit.palette(COLORS)

LENGTH, WIDTH, Z0, HEIGHT = 4.4, 1.36, 0.3, 1.02
HW = WIDTH / 2
END = dict(length=0.35, drop=0.1, tip=0.82, rise=0.04, steps=3, power=1.2)
pick = cb.banded(P, [(0.06, "dark"), (0.38, "tram_green"), (0.44, "cream")], "cream", roof="cream", windscreen="pane")
parts = [cb.loft_body(P, "carbody", LENGTH, WIDTH, Z0, HEIGHT, pick, profile=cb.ROUNDED, breaks=(0.06, 0.38, 0.44), front=END, rear=END, cap="tram_green")]
parts.append(cb.loft_body(P, "carbody roof", LENGTH - 0.7, WIDTH * 0.58, Z0 + HEIGHT - 0.01, 0.16, cb.banded(P, [], "roof_grey"), profile=cb.ROUNDED, front=dict(length=0.2, drop=0.04, tip=0.8, steps=2, power=1.0), rear=dict(length=0.2, drop=0.04, tip=0.8, steps=2, power=1.0), cap="roof_grey"))

parts += cb.window_frames(P, "cream", "pane", -1.65, 0.95, 6, Z0 + HEIGHT * 0.5, Z0 + HEIGHT * 0.85, HW, gap=0.4)
parts += cb.sliding_door(P, 1.45, Z0 + 0.12, Z0 + HEIGHT * 0.85, HW, frame="green_dark", glass="pane", width=0.6)
for sign in (-1, 1):
    y = sign * (LENGTH / 2 + 0.01)
    parts.append(lpm.box("fender", (WIDTH * 0.8, 0.12, 0.12), at=(0, y + sign * 0.06, Z0 - 0.04), color=P["black"]))
    parts += cb.round_lamp(P, 0, y + sign * 0.005, Z0 + 0.28, radius=0.07, colour="headlight" if sign < 0 else "taillight", facing=sign),
    parts.append(lpm.box("destination", (0.5, 0.03, 0.1), at=(0, y + sign * 0.0, Z0 + HEIGHT * 0.88), color=P["dark"]))
    parts.append(lpm.box("coupler", (0.1, 0.2, 0.06), at=(0, y + sign * 0.2, Z0 - 0.02), color=P["black"]))
    for side in (-1, 1):
        parts.append(lpm.box("end step", (0.18, 0.12, 0.04), at=(side * (HW - 0.1), y + sign * 0.06, Z0 - 0.12), color=P["black"]))
parts += cb.underbody(P, LENGTH, HW, Z0, color="black", spans=((-0.4, 0.4), (0.45, 0.4)))
for y in (-1.45, 1.45):
    parts += cb.truck(P, y, track=0.44, r=0.15, spacing=0.4)
for side in (-1, 1):
    parts.append(lpm.box("side skirt", (0.03, 2.6, 0.12), at=(side * (HW + 0.004), 0, Z0 - 0.08), color=P["green_dark"]))

ROOF_Z = Z0 + HEIGHT + 0.15
base = (0, 1.2, ROOF_Z)
parts.append(lpm.box("trolley base", (0.34, 0.34, 0.06), at=(0, 1.2, ROOF_Z - 0.03), color=P["black"]))
for side in (-1, 1):
    parts.append(tk.strut(P, "dark", (side * 0.14, 1.2, ROOF_Z), (side * 0.2, 0.5, ROOF_Z + 0.5), radius=0.014))
    parts.append(tk.strut(P, "dark", (side * 0.2, 0.5, ROOF_Z + 0.5), (side * 0.2, 0.0, ROOF_Z + 0.42), radius=0.012))
parts.append(lpm.box("trolley bar", (0.44, 0.04, 0.03), at=(0, 0.5, ROOF_Z + 0.5), color=P["dark"]))
parts.append(lpm.box("trolley bar", (0.44, 0.04, 0.03), at=(0, 0.0, ROOF_Z + 0.42), color=P["dark"]))
parts.append(tk.strut(P, "dark", (0, 0.5, ROOF_Z + 0.5), (0, 0.0, ROOF_Z + 0.42), radius=0.01))
for y in (-0.9, 0.0, 0.9):
    parts.append(lpm.box("roof vent", (0.16, 0.2, 0.05), at=(0, y - 0.3, ROOF_Z + 0.0), color=P["dark"]))

tk.build("Tram", parts, COLORS, tk.out_dir(__file__), budget=10000)
