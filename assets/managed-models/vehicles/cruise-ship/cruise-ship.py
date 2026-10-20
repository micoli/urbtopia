"""Cruise ship: white hull with a blue band, stacked decks of blue windows, orange lifeboats and a funnel aft, bow at -Y."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import transport_kit as tk  # noqa: E402
import vehicle_kit as kit  # noqa: E402
import lpm  # noqa: E402

lpm.reset()
COLORS = [("blue", "#2a5fa8"), ("sky", "#4e8fd8"), ("orange", "#ee7a2a"), ("deck", "#cfc7b4"), ("yellow", "#f2c030")]
P = kit.palette(COLORS)

LENGTH, BEAM, H_LOW, H_UP = 8.0, 1.4, 0.16, 0.42
STATIONS = [(0.0, 0.0), (0.05, 0.45), (0.18, 0.88), (0.35, 1.0), (0.88, 1.0), (1.0, 0.82)]
DECK = H_LOW + H_UP
parts = tk.hull(P, LENGTH, BEAM, H_LOW, H_UP, "blue", "white", stations=STATIONS, rim="white", deck="deck")
parts += kit.panel("blue band", P, "blue", -2.6, 3.4, DECK - 0.17, DECK - 0.1, BEAM / 2 * 1.04)
parts += tk.window_row(P, "sky", -2.6, 3.4, DECK - 0.27, BEAM / 2 * 1.04, 30, height=0.05, gap=0.5)

z = DECK
widths = [(1.0, -2.6, 3.3), (0.9, -2.2, 3.0), (0.8, -1.4, 2.6), (0.62, -0.6, 2.0)]
for level, (frac, y0, y1) in enumerate(widths):
    w = BEAM * frac * 0.92
    parts.append(lpm.box(f"deck {level}", (w, y1 - y0, 0.2), at=(0, (y0 + y1) / 2, z), color=P["white"]))
    count = int((y1 - y0) / 0.16)
    parts += tk.window_row(P, "sky", y0 + 0.08, y1 - 0.08, z + 0.1, w / 2, count, height=0.07, gap=0.4)
    parts.append(lpm.box(f"deck {level} edge", (w + 0.04, y1 - y0 + 0.04, 0.025), at=(0, (y0 + y1) / 2, z + 0.2), color=P["deck"]))
    z += 0.22
    if level == 0:
        for y in (-1.8, -1.2, -0.6, 0.0, 0.6, 1.2, 1.8, 2.4):
            for side in (-1, 1):
                parts.append(lpm.box("lifeboat", (0.1, 0.28, 0.07), at=(side * (BEAM * 0.46), y, z - 0.02), color=P["orange"]))
bridge_y = -2.2
parts.append(lpm.box("bridge", (BEAM * 0.6, 0.5, 0.16), at=(0, bridge_y, DECK + 0.22), color=P["white"]))
parts.append(lpm.box("bridge glass", (BEAM * 0.58, 0.03, 0.08), at=(0, bridge_y - 0.26, DECK + 0.28), color=P["sky"]))
parts += tk.funnel(P, 1.5, z, 0.42, 0.2, "white", top="blue", ry=1.6)
parts.append(lpm.box("funnel stripe", (0.42, 0.62, 0.05), at=(0, 1.5, z + 0.25), color=P["yellow"]))
parts.append(tk.mast(P, -1.6, DECK + 0.42, 0.7, radius=0.025, color="white"))
parts.append(lpm.box("radar", (0.3, 0.04, 0.06), at=(0, -1.6, DECK + 1.0), color=P["dark"]))
parts.append(lpm.box("pool", (0.5, 0.7, 0.03), at=(0, 2.7, DECK + 0.46), color=P["sky"]))

tk.build("CruiseShip", parts, COLORS, tk.out_dir(__file__), budget=9000)
